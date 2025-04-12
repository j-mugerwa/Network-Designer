class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.details = details;

    // Capture stack trace (excluding constructor call)
    Error.captureStackTrace(this, this.constructor);
  }

  // Factory method for validation errors
  static validationError(errors) {
    return new AppError("Validation failed", 400, { errors });
  }

  // Factory method for not found errors
  static notFound(resource = "Resource") {
    return new AppError(`${resource} not found`, 404);
  }

  // Factory method for unauthorized access
  static unauthorized() {
    return new AppError("Unauthorized access", 401);
  }
}

module.exports = AppError;
