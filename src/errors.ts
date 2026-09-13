export interface MaketouErrorOptions {
  code?: string;
  operation: string;
  retryAfter?: number;
  status: number;
}

export class MaketouError extends Error {
  readonly code?: string;
  readonly operation: string;
  readonly retryAfter?: number;
  readonly status: number;

  constructor(message: string, options: MaketouErrorOptions) {
    super(message);
    this.name = "MaketouError";
    this.code = options.code;
    this.operation = options.operation;
    this.retryAfter = options.retryAfter;
    this.status = options.status;
  }
}

export class MaketouConfigurationError extends Error {
  override name = "MaketouConfigurationError";
}

export class MaketouRateLimitedError extends MaketouError {
  override name = "MaketouRateLimitedError";
}
