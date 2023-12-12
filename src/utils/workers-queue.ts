interface Worker {
  cargoId: string
  userId: string
}

export default class WorkersQueue {
  queue: Record<string, Worker[]> = {}

  // Add user to a queue
  push(cargoId: string, userId: string) {
    if (!Array.isArray(this.queue?.[cargoId])) {
      this.queue[cargoId] = []
    }

    this.queue[cargoId].unshift({ cargoId, userId })
  }

  // Get last user from a queue and remove it
  pop(cargoId: string) {
    if (!Array.isArray(this.queue?.[cargoId])) {
      return null
    }

    if (this.queue[cargoId].length === 0) {
      return null
    }

    const worker = this.queue[cargoId].pop()
    return worker ?? null
  }

  filter(cargoId: string, cb: (worker: Worker) => boolean) {
    if (!Array.isArray(this.queue?.[cargoId])) {
      return
    }

    this.queue[cargoId] = this.queue[cargoId].filter(cb)
  }
}
