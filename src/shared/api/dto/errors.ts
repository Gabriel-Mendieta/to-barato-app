export type ApiErrorDetails =
  | string
  | number
  | boolean
  | null
  | ApiErrorDetails[]
  | { [key: string]: ApiErrorDetails | undefined };

export type ApiErrorShape = {
  message: string;
  status?: number;
  code?: string;
  details?: ApiErrorDetails;
};

export class ApiError extends Error implements ApiErrorShape {
  readonly name = 'ApiError';
  readonly status?: number;
  readonly code?: string;
  readonly details?: ApiErrorDetails;

  constructor({ message, status, code, details }: ApiErrorShape) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
