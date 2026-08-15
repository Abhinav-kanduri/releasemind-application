type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function booleanValue(...values: unknown[]): boolean | undefined {
  return values.find((value): value is boolean => typeof value === "boolean");
}

export function normalizeImpactApiFailure(body: unknown, status: number) {
  const failure = asRecord(body);
  const nestedError = asRecord(failure.error);
  const detail = asRecord(failure.detail);
  const code =
    nonEmptyString(failure.code) ||
    nonEmptyString(nestedError.code) ||
    nonEmptyString(detail.code) ||
    "IMPACT_API_ERROR";
  const message =
    nonEmptyString(failure.error) ||
    nonEmptyString(failure.message) ||
    nonEmptyString(nestedError.message) ||
    nonEmptyString(detail.message) ||
    nonEmptyString(failure.detail) ||
    `Impact Analysis returned ${status}.`;
  const details =
    failure.details ??
    nestedError.details ??
    detail.details ??
    (Object.keys(detail).length ? detail : undefined);
  const retryable = booleanValue(
    failure.retryable,
    nestedError.retryable,
    detail.retryable,
  );

  return { code, message, details, retryable };
}
