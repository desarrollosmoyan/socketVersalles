/* interface Queue<T> {
  queue: Record<string, T[]>
  has: (id: string) => boolean
  push: (key: string, value: T) => void
  pop: (key: string) => T | null
  filter: (key: string, cb: (value: T) => boolean) => void
} */

export class Queue<T> {
  queue: Record<string, T[]> = {}

  has(value: T) {
    const values = Object.values(this.queue).flat()
    return values.find((_value) => _value === value) ?? null
  }

  push(key: string, value: T) {
    if (this.has(value) !== null) return

    if (!Array.isArray(this.queue?.[key])) {
      this.queue[key] = []
    }

    this.queue[key].unshift(value)
  }

  pop(key: string) {
    if (!Array.isArray(this.queue?.[key])) return null
    if (this.queue[key].length === 0) return null

    const worker = this.queue[key].pop()
    return worker ?? null
  }

  filter(key: string, cb: (value: T) => boolean) {
    if (!Array.isArray(this.queue?.[key])) return
    this.queue[key] = this.queue[key].filter(cb)
  }
}
