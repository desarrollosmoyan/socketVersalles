import 'dotenv/config'
import 'module-alias/register'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

import Server from './server'
import logger from './utils/logger'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('America/Lima')

const now = dayjs().format('YYYY-MM-DD hh:mm:ss')

const server = new Server()

server
  .start()
  .then(() => logger.info(`Server started at ${now}`))
  .catch(() => logger.info(`Error starting server at ${now}`))
