interface Order {
  cargoId: string
  pedidoId: string
}

export default class OrdersQueue {
  queue = new Map<string, Set<Order>>()

  // Add order to a queue
  push(cargoId: string, pedidoId: string) {
    if (this.queue.has(cargoId)) {
      const queueByCargo = this.queue.get(cargoId)
      if (queueByCargo === undefined) {
        this.queue.set(cargoId, new Set([{ pedidoId, cargoId }]))
      } else {
        queueByCargo.add({ pedidoId, cargoId })
        this.queue.set(cargoId, queueByCargo)
      }
    } else {
      this.queue.set(cargoId, new Set([{ pedidoId, cargoId }]))
    }
  }

  // Get last order from a queue and remove it
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
