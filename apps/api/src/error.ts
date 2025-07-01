import { NextFunction, Request, Response } from 'express'
import * as z  from 'zod/v4'

const ZodErrorCode = z.enum([
  "bad_request",
  "unauthorized",
  "forbidden",
  "not_found",
  "conflict",
  "internal_server_error",
]) 

type ErrorCode = z.infer<typeof ZodErrorCode>

const errorCodeToHttpStatus: Record<ErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401, 
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  internal_server_error: 500,
}

interface ApiErrorSchema {
  code: ErrorCode
  message: string,
  fieldErrors?: Record<string, string[]>
}

export class ApiError extends Error {
  
  public readonly code: ErrorCode
  public readonly fieldErrors?: Record<string, string[]>

  constructor({
    code,
    message,
    fieldErrors
  }: ApiErrorSchema) {

    super(message)
    this.code = code
    this.fieldErrors = fieldErrors
    Error.captureStackTrace(this, this.constructor)
  }
}


export function errorMiddleware(err:any, req:Request, res:Response, next:NextFunction): void {
  if(err instanceof z.ZodError) {
    const fieldErrors = z.flattenError(err).fieldErrors
    res.status(400).json({
      error: {
        code: "invalid_inputs",
        message: "validation failed",
        fieldErrors
      } 
    })
    return
  }

  if(err instanceof ApiError) {
    res.status(errorCodeToHttpStatus[err.code]).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.fieldErrors &&{fieldErrors: err.fieldErrors})
      }
    })
    return
  }

  console.log("unexpected error", err)
  res.status(500).json({
    error: {
      code: "internal_server_error",
      message: "An internal server error occurred. Please contact our support if the problem persists."
    }
  })
}