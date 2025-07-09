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
    roomId: string,
    code: string
  }

}

interface BaseResponse {
  type: "response",
  eventType: "room:create" | "room:join" | "room:leave" | "room:codeChange" | "room:submit" | "solo:init" | "solo:submit" 
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

export type WSClientRequest = | CreateRoomPayload | JoinRoomPayload | LeaveRoomPayload | CodeChangePayload
export type WSResponse<T=any> = SuccessResponse<T> | ErrorResponse

