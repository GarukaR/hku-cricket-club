import type { TextFieldSingleValidation } from "payload";

/**
 * Wires one of the `…Problem` functions in `src/lib` into the field it guards.
 *
 * The rules themselves are plain functions, tested without Payload anywhere
 * near them; this is the one place that knows Payload spells "nothing wrong"
 * as `true` and hands a missing value through as `null`.
 */
export function validated(
  check: (value: string | undefined) => string | undefined,
): TextFieldSingleValidation {
  return (value) => check(value ?? undefined) ?? true;
}
