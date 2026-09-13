# Documentation audit

## Missing API key error code differs from the documentation

### Documentation

The checkout guide and OpenAPI examples describe a `401` response with the `INVALID_API_KEY` code.

### Problem

A caller cannot reliably narrow an unauthenticated error to `INVALID_API_KEY` from the published documentation.

### Observed behavior

On 2026-09-13, unauthenticated requests to both documented public cart endpoints returned HTTP `401` with:

```json
{
  "code": "MISSING_API_KEY",
  "message": "API key is missing"
}
```

No authenticated or state-changing request was made.

### Impact

Medium

### Suggested improvement

Document `MISSING_API_KEY` for a missing `Authorization` header and distinguish it from an invalid API key if the API makes that distinction.

## Rate-limit headers are not guaranteed on every response

### Documentation

The rate-limit guide states that every public API response includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`.

### Problem

The statement conflicts with the OpenAPI definition, which does not define those headers for `401` responses.

### Observed behavior

On 2026-09-13, the unauthenticated `401` responses from both public cart endpoints did not include any `X-RateLimit-*` header.

### Impact

Low

### Suggested improvement

State which response statuses include rate-limit headers and describe them as optional for clients handling errors.
