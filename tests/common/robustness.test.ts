import { describe, it, expect, afterEach } from "vitest"
import type { ZodType } from "zod"
import {
  boolean,
  color,
  coordinate,
  creditCard,
  date,
  datetime,
  email,
  file,
  id,
  ip,
  manyOf,
  number,
  oneOf,
  password,
  text,
  time,
  url,
  twBankAccount,
  twBusinessId,
  twFax,
  twInvoice,
  twLicensePlate,
  twMobile,
  twNationalId,
  twPassport,
  twPostalCode,
  twTel,
  setLocale,
} from "../../src"

// Every validator (with its main option combinations) must turn hostile input into a failed result, never an exception
const factories: Record<string, (required: boolean) => ZodType[]> = {
  boolean: (r) => [boolean(r), boolean(r, { strict: true }), boolean(r, { emptyValue: undefined }), boolean(r, { emptyValue: "" }), boolean(r, { shouldBe: true })],
  color: (r) => [color(r), color(r, { format: "hex" }), color(r, { format: ["rgb", "hsl"], allowAlpha: false })],
  coordinate: (r) => [coordinate(r), coordinate(r, { type: "latitude" }), coordinate(r, { type: "pair", precision: 2 })],
  creditCard: (r) => [creditCard(r), creditCard(r, { cardType: "visa" })],
  date: (r) => [date(r), date(r, { format: "YYYY/MM/DD", min: "2020/01/01" })],
  datetime: (r) => [datetime(r), datetime(r, { format: "ISO" }), datetime(r, { format: "UNIX" }), datetime(r, { trimMode: "none", casing: "upper", whitelist: ["now"] })],
  email: (r) => [email(r), email(r, { lowercase: false, domain: "example.com" })],
  file: (r) => [file(r), file(r, { imageOnly: true, maxSize: 10 })],
  id: (r) => [id(r), id(r, { type: "uuid" }), id(r, { type: "numeric" }), id(r, { allowedTypes: ["uuid", "nanoid"], caseSensitive: false })],
  ip: (r) => [ip(r), ip(r, { version: "v4", allowCIDR: true })],
  manyOf: (r) => [manyOf(r, { values: ["a", "b", 1] }), manyOf(r, { values: ["A", "b"], caseSensitive: false, min: 1 })],
  number: (r) => [number(r), number(r, { parseCommas: true, whitespaceAsEmpty: true }), number(r, { emptyValue: undefined }), number(r, { type: "integer" })],
  oneOf: (r) => [oneOf(r, { values: ["a", "b"] }), oneOf(r, { values: [1, 2] }), oneOf(r, { values: ["a", 1], directIssue: true }), oneOf(r, { values: ["A"], caseSensitive: false })],
  password: (r) => [password(r), password(r, { uppercase: true, digits: true, minStrength: "strong" })],
  text: (r) => [text(r), text(r, { strict: true }), text(r, { trimMode: "none", casing: "title", whitespaceAsEmpty: true })],
  time: (r) => [time(r), time(r, { format: "hh:mm A" }), time(r, { whitelist: ["noon"], whitelistOnly: true })],
  url: (r) => [url(r), url(r, { protocols: ["https"], allowedDomains: ["example.com"] })],
  twBankAccount: (r) => [twBankAccount(r), twBankAccount(r, { validateBankCode: false })],
  twBusinessId: (r) => [twBusinessId(r)],
  twFax: (r) => [twFax(r)],
  twInvoice: (r) => [twInvoice(r)],
  twLicensePlate: (r) => [twLicensePlate(r), twLicensePlate(r, { plateType: "motorcycle" })],
  twMobile: (r) => [twMobile(r), twMobile(r, { normalize: true })],
  twNationalId: (r) => [twNationalId(r), twNationalId(r, { type: "resident", allowOldResident: true })],
  twPassport: (r) => [twPassport(r), twPassport(r, { passportType: "ordinary" })],
  twPostalCode: (r) => [twPostalCode(r), twPostalCode(r, { format: "6", strictValidation: true }), twPostalCode(r, { allowDashes: false })],
  twTel: (r) => [twTel(r), twTel(r, { allowITFS: false })],
}

const throwing = () => {
  throw new Error("boom")
}

const revoked = () => {
  const { proxy, revoke } = Proxy.revocable({}, {})
  revoke()
  return proxy
}

const hostileInputs: Array<[string, () => unknown]> = [
  ["Object.create(null)", () => Object.create(null)],
  ["null-prototype object with properties", () => Object.assign(Object.create(null), { a: 1 })],
  ["throwing toString", () => ({ toString: throwing })],
  ["throwing toString and valueOf", () => ({ toString: throwing, valueOf: throwing })],
  ["throwing Symbol.toPrimitive", () => ({ [Symbol.toPrimitive]: throwing })],
  ["toString / valueOf returning objects", () => ({ toString: () => ({}), valueOf: () => ({}) })],
  ["Symbol", () => Symbol("x")],
  ["Symbol without description", () => Symbol()],
  ["boxed Symbol", () => Object(Symbol("boxed"))],
  ["BigInt", () => 1n],
  ["Proxy of a null-prototype object", () => new Proxy(Object.create(null), {})],
  ["Proxy with throwing get", () => new Proxy({}, { get: throwing })],
  ["Proxy with throwing getPrototypeOf", () => new Proxy({}, { getPrototypeOf: throwing })],
  ["Proxy with throwing has", () => new Proxy(new Date(0), { has: throwing })],
  ["Proxy with every trap throwing", () => new Proxy({}, { get: throwing, has: throwing, getPrototypeOf: throwing, ownKeys: throwing })],
  ["Proxy of a function with throwing get", () => new Proxy(() => {}, { get: throwing })],
  ["revoked Proxy", revoked],
  ["array containing a null-prototype object", () => [Object.create(null)]],
  ["array containing a Symbol", () => [Symbol("s")]],
  ["array containing a revoked Proxy", () => [revoked()]],
  ["null-prototype array", () => Object.setPrototypeOf([], null)],
]

describe("all validators are robust against unconvertible input", () => {
  afterEach(() => setLocale("en-US"))

  for (const locale of ["en-US", "zh-TW"] as const) {
    for (const [name, make] of Object.entries(factories)) {
      for (const required of [false, true]) {
        it(`${name}(${required}) never throws from safeParse (${locale})`, () => {
          setLocale(locale)
          for (const schema of make(required)) {
            for (const [label, input] of hostileInputs) {
              let result: ReturnType<ZodType["safeParse"]> | undefined
              expect(() => {
                result = schema.safeParse(input())
                // The issues are materialized lazily; reading them must not throw either
                if (!result.success) void result.error.issues.map((issue) => issue.message)
              }, label).not.toThrow()
              if (result && !result.success) {
                expect(typeof result.error.issues[0].message, label).toBe("string")
                expect(result.error.issues[0].message.length, label).toBeGreaterThan(0)
              }
            }
          }
        })
      }
    }
  }

  it("still accepts the inputs that convert normally", () => {
    expect(text(true).parse({ toString: () => "hello" })).toBe("hello")
    expect(email(true).parse({ toString: () => "a@example.com" })).toBe("a@example.com")
    expect(text(true).parse(Symbol("x"))).toBe("Symbol(x)")
    expect(text(true).parse(1n)).toBe("1")
    expect(number(true).parse("42")).toBe(42)
    expect(boolean(true).parse("true")).toBe(true)
  })
})
