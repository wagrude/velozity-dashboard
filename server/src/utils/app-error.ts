export class AppError extends Error {
  readonly statusCode: number;
  readonly errors?: unknown;

  constructor(statusCode: number, message: string, errors?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    if (errors !== undefined) {
      this.errors = errors;
    }
  }
}
