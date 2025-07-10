import "ws"

declare module "ws" {
  interface WebSocket {
    roomId?: string
    userId?: string
    isAlive?: boolean
  }
}
