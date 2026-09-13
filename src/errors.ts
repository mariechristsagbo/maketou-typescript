export interface MaketouValidationIssue {
  message: string;
  path: string;
}

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

export class MaketouResponseError extends MaketouError {
  readonly issues: readonly MaketouValidationIssue[];

  constructor(operation: string, status: number, issues: readonly MaketouValidationIssue[]) {
    super("Maketou returned an unexpected response.", { operation, status });
    this.name = "MaketouResponseError";
    this.issues = issues;
  }
}
