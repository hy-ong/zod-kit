/**
 * @fileoverview Exception-safe value conversion helpers for Zod Kit
 *
 * `String(value)` / `Number(value)` throw for some inputs (null-prototype objects, objects whose
 * `toString` / `valueOf` / `Symbol.toPrimitive` throw, arrays containing symbols, revoked proxies, ...),
 * and Zod itself throws when it has to inspect a value whose prototype lookup throws (e.g. a revoked Proxy).
 * These helpers let preprocess functions reject such input with a normal validation issue instead, so
 * `safeParse` never throws. For every input that converts normally the result is exactly the same as
 * calling `String()` / `Number()` directly.
 */

import { z } from "zod"

/**
 * `String(value)` that never throws
 *
 * @returns The same string as `String(value)`, or `undefined` when the conversion throws
 */
export function safeString(value: unknown): string | undefined {
  try {
    return String(value)
  } catch {
    return undefined
  }
}

/**
 * `Number(value)` that never throws
 *
 * @returns The same number as `Number(value)`, or `NaN` when the conversion throws (e.g. a Symbol)
 */
export function safeNumber(value: unknown): number {
  try {
    return Number(value)
  } catch {
    return NaN
  }
}

/**
 * Whether Zod can pass the value along without throwing
 *
 * Zod checks every preprocess / transform result with `instanceof Promise`, which walks the prototype chain.
 * A revoked Proxy, or a Proxy whose `getPrototypeOf` trap throws, makes that (and `Array.isArray`) throw.
 * Primitives and ordinary objects are always inspectable.
 */
export function isInspectable(value: unknown): boolean {
  if (value === null || (typeof value !== "object" && typeof value !== "function")) return true
  try {
    Array.isArray(value)
    // Walk the whole chain, like `instanceof` does
    let proto: unknown = value
    for (let depth = 0; proto !== null && depth < 1000; depth++) proto = Object.getPrototypeOf(proto)
    return true
  } catch {
    return false
  }
}

/**
 * Whether Zod can also describe the value in its default type messages without throwing
 *
 * On top of {@link isInspectable}, this repeats exactly what Zod does to name the received type of an object
 * (`"constructor" in value`, `value.constructor.name`), which throws for e.g. a Proxy whose `has` / `get` trap
 * throws. Only needed where the value reaches a Zod schema that reports such a default message (e.g. `z.number()`).
 */
export function isDescribable(value: unknown): boolean {
  if (!isInspectable(value)) return false
  if (value === null || typeof value !== "object" || Array.isArray(value)) return true
  try {
    if (Object.getPrototypeOf(value) !== Object.prototype && "constructor" in value) {
      const ctor = (value as { constructor?: { name?: unknown } }).constructor
      if (ctor) void ctor.name
    }
    return true
  } catch {
    return false
  }
}

/**
 * Rejects the current input from inside a preprocess function: records a custom issue and returns `z.NEVER`
 *
 * The issue stops the pipe, so the rejected value is never passed on to the inner schema or later refinements.
 *
 * @example
 * ```typescript
 * z.preprocess((val, ctx) => {
 *   const str = safeString(val)
 *   if (str === undefined) return rejectInput(ctx, getMessage("invalid"))
 *   return str.trim()
 * }, z.string())
 * ```
 */
export function rejectInput(ctx: z.core.$RefinementCtx, message: string): never {
  ctx.addIssue({ code: "custom", message })
  return z.NEVER
}
