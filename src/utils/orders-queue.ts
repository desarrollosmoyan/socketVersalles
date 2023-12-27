interface Order {
  cargoId: string
  pedidoId: string
}

export default class OrdersQueue {
  queue: Record<string, Order[]> = {}

  has(pedidoId: string) {
    const orders = Object.values(this.queue).flat()
    const order = orders.find((order) => order.pedidoId === pedidoId)
    return order ?? null
  }

  // Add order to a queue
  push(cargoId: string, pedidoId: string) {
    if (!Array.isArray(this.queue?.[cargoId])) {
      this.queue[cargoId] = []
    }

    this.queue[cargoId].unshift({ cargoId, pedidoId })
  }

  // Get last order from a queue and remove it
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
}
