interface Worker {
  cargoId: string
  userId: string
}

export default class WorkersQueue {
  queue = new Map<string, Set<Worker>>()

  // Add user to a queue
  push(cargoId: string, userId: string) {
    if (this.queue.has(cargoId)) {
      const queueByCargo = this.queue.get(cargoId)
      if (queueByCargo === undefined) {
        this.queue.set(cargoId, new Set([{ userId, cargoId }]))
      } else {
        queueByCargo.add({ userId, cargoId })
        this.queue.set(cargoId, queueByCargo)
      }
    } else {
      this.queue.set(cargoId, new Set([{ userId, cargoId }]))
    }
  }

  // Get last user from a queue and remove it
  pop(cargoId: string) {
    const queueByCargo = this.queue.get(cargoId)
    if (queueByCargo === undefined) return null

    const lastUser = [...queueByCargo].pop()
    if (lastUser === undefined) return null

    queueByCargo.delete(lastUser)
    this.queue.set(cargoId, queueByCargo)

    return lastUser
  }
}
