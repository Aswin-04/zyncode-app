interface CreateRoomPayload {
  type: "create",
}

interface JoinRoomPayload {
  type: "join",
  payload: {
    roomId: string
  }
}

interface LeaveRoomPayload {
  type: "leave",
  payload: {
    roomId: string
  }
}

interface CodeChangePayload {
  type: "codeChange",
  payload: {
    code: string
  }
}

interface BaseResponse {
  type: "response",
  eventType: WSEventType 
  success: boolean
}

interface SuccessResponse<T=any> extends BaseResponse {
  success: true,
  data: T
}

interface ErrorResponse extends BaseResponse {
  success: false,
  error: {
    message: string
  }
}

export type WSEventType = 
  | "room:create"
  | "room:join"
  | "room:leave"
  | "room:code-update"
  | "session:init"
  | "execution:result";

export type WSClientRequest = 
  | CreateRoomPayload 
  | JoinRoomPayload 
  | LeaveRoomPayload 
  | CodeChangePayload

export type WSResponse<T=any> = SuccessResponse<T> | ErrorResponse


