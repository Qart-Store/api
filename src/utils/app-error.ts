class AppError extends Error {
  statusCode: number;
  status: ErrorApiResponseStatus;
  data?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    status: ErrorApiResponseStatus = "failed",
    data?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.status = status;
    this.data = data;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export default AppError;
