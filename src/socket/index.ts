import { CONN } from './events'
import { Server, type Socket as TypedSocket } from 'socket.io'

import OrdersQueue from '@/utils/orders-queue'
import WorkersQueue from '@/utils/workers-queue'

import type { HTTPServer } from '@/server'
import type { DefaultEventsMap } from 'socket.io/dist/typed-events'

interface ClientSocketPayload {
  userId: string
  cargoId: string
}

type ClientSocket = TypedSocket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, ClientSocketPayload>

interface NewOrderArgs {
  cargoId: string
  pedidoId: string
}

interface FinishOrderArgs {
  cargoId: string
  pedidoId: string
}

export default class Socket {
  io: Server
  ordersQueue = new OrdersQueue()
  workersQueue = new WorkersQueue()
  users = new Map<string, string>()

  constructor(server: HTTPServer) {
    this.io = new Server(server, { cors: { origin: '*', credentials: true } })

    this.io.use((socket, next) => {
      const userId = (socket.handshake.auth?.userId as string) ?? null
      const cargoId = (socket.handshake.auth?.cargoId as string) ?? null
      socket.data = { userId, cargoId }
      next()
    })
  }

  start() {
    this.io.on(CONN.CONNECTION, (socket: ClientSocket) => {
      const userId = socket.data.userId

      if (userId === undefined) {
        socket.disconnect()
        return
      }

      const cargoId = socket.data.cargoId
      this.users.set(userId, socket.id)
      if (typeof cargoId === 'string') {
        this.workersQueue.push(cargoId, userId)
        console.log('1', this.workersQueue.queue)
      }

      console.log(`USER_ID_CONNECTED: ${userId}-${cargoId}`)

      socket.on('order:new-order', (args: NewOrderArgs) => {
        // remove the worker from the queue
        const worker = this.workersQueue.pop(args.cargoId)

        // in case it is null then add the order to orders queue and wait to be assigned
        if (worker === null) {
          this.ordersQueue.push(args.cargoId, args.pedidoId)
          return
        }

        // check if the worker is still connected
        const socketId = this.users.get(worker?.userId)
        if (socketId === undefined) return

        console.log('NEW_ORDER: ', args)
        console.log('2', this.workersQueue.queue)
        socket.to(socketId).emit('order:new-order', args)
      })

      socket.on('order:finish-order', (args: FinishOrderArgs) => {
        // check if the worker is still connected
        console.log({ userId })
        const socketId = this.users.get(userId)
        if (socketId === undefined) return

        // check if have orders in queue
        const order = this.ordersQueue.pop(args.cargoId)
        if (order === null) {
          // Push the worker back to the queue
          this.workersQueue.push(args.cargoId, userId)
          console.log('3', this.workersQueue.queue)
          console.log('FINISH_ORDER: ', args)
          return
        }

        console.log('NEW_ORDER: ', args)
        console.log('4', this.workersQueue.queue)
        this.io.to(socketId).emit('order:new-order', order)
      })

      socket.on(CONN.DISCONNECTING, () => {
        this.users.delete(userId)
        if (typeof cargoId === 'string') {
          this.workersQueue.filter(cargoId, (worker) => worker.userId !== userId)
        }

        console.log(`USER_ID_DISCONNECTING: ${userId}`)
      })
    })
  }
}
