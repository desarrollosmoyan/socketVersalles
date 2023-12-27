import { CONN } from './events'
import { Server, type Socket as TypedSocket } from 'socket.io'

import { Queue } from '@/utils/queue'
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
  users = new Map<string, string>()
  ordersQueue = new Queue<string>()
  workersQueue = new Queue<string>()
  busyWorkers = new Set<string>()

  constructor(server: HTTPServer) {
    this.io = new Server(server, { cors: { origin: '*', credentials: true } })

    this.io.use((socket, next) => {
      const userId = (socket.handshake.auth?.userId as string) ?? null
      const cargoId = (socket.handshake.auth?.cargoId as string) ?? null
      socket.data = { userId, cargoId }
      next()
    })
  }

  snapshot(key: string) {
    console.log(`=========== SNAPSHOT ${key} ============`)
    console.log('USER: ', this.users)
    console.log('BUSY_WORKERS: ', this.busyWorkers)
    console.log('ORDERS_QUEUE: ', this.ordersQueue.queue)
    console.log('WORKERS_QUEUE: ', this.workersQueue.queue)
    console.log('========================================')
  }

  start() {
    this.io.on(CONN.CONNECTION, (socket: ClientSocket) => {
      const userId = socket?.data?.userId
      const cargoId = socket?.data?.cargoId
      const isWorker = typeof cargoId === 'string'

      if (userId === undefined) {
        socket.disconnect()
        return
      }

      console.log(`USER_ID_CONNECTED: ${userId}`)

      this.users.set(userId, socket.id)
      if (isWorker && !this.busyWorkers.has(userId)) {
        // check if have orders in queue
        const order = this.ordersQueue.pop(cargoId)
        if (order === null) {
          this.workersQueue.push(cargoId, userId)
        } else {
          this.busyWorkers.add(userId)
          this.io.to(socket.id).emit('order:new-order', order)
        }

        this.snapshot('CONNECTION')
      }

      socket.on('order:new-order', (args: NewOrderArgs) => {
        console.log('order:new-order: ', { args })
        // remove the worker from the queue
        const lastUserId = this.workersQueue.pop(args.cargoId)

        // in case it is null then add the order to orders queue and wait to be assigned
        if (lastUserId === null) {
          this.ordersQueue.push(args.cargoId, args.pedidoId)
          this.snapshot('NEW_ORDER_SAVED')
          return
        }

        // check if the worker is still connected
        const socketId = this.users.get(lastUserId)
        if (socketId === undefined) return

        this.busyWorkers.add(lastUserId)
        socket.to(socketId).emit('order:new-order', args)
        this.snapshot('NEW_ORDER_EMITED')
      })

      socket.on('order:finish-order', (args: FinishOrderArgs) => {
        // check if the worker is still connected
        const socketId = this.users.get(userId)
        if (socketId === undefined) return

        // check if have orders in queue
        const order = this.ordersQueue.pop(args.cargoId)
        if (order === null) {
          // Push the worker back to the queue
          this.busyWorkers.delete(userId)
          this.workersQueue.push(args.cargoId, userId)
          this.snapshot('FINISH_ORDER_PUSHED_BACK')
          return
        }

        this.snapshot('FINISH_ORDER_EMITED')
        this.io.to(socketId).emit('order:new-order', { cargoId: args.cargoId, pedidoId: order })
      })

      socket.on(CONN.DISCONNECTING, () => {
        this.users.delete(userId)
        if (typeof cargoId === 'string') {
          this.busyWorkers.delete(userId)
          this.workersQueue.filter(cargoId, (_userId) => _userId !== userId)
        }

        this.snapshot('DISCONNECTING')

        console.log(`USER_ID_DISCONNECTING: ${userId}`)
      })
    })
  }
}
