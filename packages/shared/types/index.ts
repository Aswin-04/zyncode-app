export type SupportedLanguage = "JavaScript" | "Java" | "C" | "C++" | "Python";

interface CreateRoomPayload {
  type: "create";
}

interface JoinRoomPayload {
  type: "join";
  payload: {
    roomId: string;
  };
}

interface LeaveRoomPayload {
  type: "leave";
  payload: {
    roomId: string;
  };
}

interface CodeChangePayload {
  type: "codeChange";
  payload: {
    code: string;
  };
}

interface ChangeLanguagePayload {
  type: "changeLanguage";
  payload: {
    language: SupportedLanguage;
  };
}


export type AllSuccessResponses =  {
  [K in WSEventType]: {
    success: true, 
    eventType: K 
    data: WSDataMap[K]
  }
}[WSEventType]

export interface ErrorResponse {
  eventType: WSEventType
  success: false;
  error: {
    message: string;
  };
}

export type SuccessResponse<T extends WSEventType> = {
  eventType: T;
  success: true;
  data: WSDataMap[T];
};


export type WSEventType =
  | "room:create"
  | "room:join"
  | "room:leave"
  | "room:code-update"
  | "session:init"
  | "execution:result"
  | "room:members-update"
  | "room:user-join"
  | "room:user-leave"
  | "room:language-update";

export type WSClientRequest =
  | CreateRoomPayload
  | JoinRoomPayload
  | LeaveRoomPayload
  | CodeChangePayload
  | ChangeLanguagePayload;

export type WSResponse = AllSuccessResponses | ErrorResponse;

export interface ExecutionResult {
  username: string;
  stdin: string;
  stdout: string;
  stderr: string;
  verdict: string;
}

export interface WSDataMap {
  "room:create": { roomId: string; latestCode: string; message: string };
  "room:join": { roomId: string; latestCode: string; message: string };
  "room:leave": { roomId: string; message: string };
  "room:code-update": { latestCode: string };
  "session:init": { message: string };
  "execution:result": { executionResult: ExecutionResult };
  "room:members-update": { members: { userId: string; username: string }[] };
  "room:user-join": { username: string; message: string };
  "room:user-leave": { username: string; message: string };
  "room:language-update": { language: SupportedLanguage };
}
