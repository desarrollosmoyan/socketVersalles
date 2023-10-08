import http from 'http'
import cors from 'cors'
import express, { type Express } from 'express'

import Socket from './socket'
import logger from './utils/logger'
import config from './config'

export type HTTPServer = http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>

class Server {
  app: Express
  socket: Socket
  server: HTTPServer
  port = config.server.port

  constructor() {
    this.app = express()
    this.server = http.createServer(this.app)
    this.socket = new Socket(this.server)
  }

  middlewares() {
    this.app.use(cors())
  }

  async start() {
    // Start middlewares
    this.middlewares()

    // SocketConnetion
    this.socket.start()

    // Start Server
    await new Promise((resolve) => {
      this.server.listen(this.port, () => {
        resolve(true)
      })
    })

    logger.info(`Started server on http://localhost:${this.port}`)
  }
}

export default Server
