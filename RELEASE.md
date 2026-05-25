# Release Notes Format

Use this format for GitHub releases so each release is consistent, readable, and suitable for users reviewing upgrade impact.

## Release Title

Use the tag name as the release title:

```md
vX.Y.Z
```

Example:

```md
v0.2.9
```

## Release Body Template

```md
## @hy_ong/zod-kit vX.Y.Z

### Highlights
- Summarize the most important user-facing changes.
- Mention compatibility or upgrade impact when relevant.
- Keep this section short: two to four bullets.

### Breaking Changes
- List any breaking API, runtime, type, validation, or behavior changes.
- If there are no breaking changes, write: `None.`

### Added
- New validators, options, exports, formats, test coverage, or documented capabilities.

### Fixed
- Bug fixes, compatibility fixes, security hardening, incorrect behavior, or documentation inaccuracies.

### Changed
- Dependency updates, build configuration changes, internal refactors, or non-breaking behavior changes.

### Documentation
- README, examples, usage notes, migration notes, or API documentation updates.

### Verification
- `npm test -- --run` - result.
- `npx eslint src/` - result.
- `npx tsc --noEmit` - result.
- `npm run build` - result.
- `npm audit` - result.
- `npm outdated` - result.
```

## Writing Rules

- Write release notes in English to match the public package documentation.
- Keep the release title exactly aligned with the Git tag.
- Lead with user impact, then implementation detail.
- Use present or past tense consistently within a section.
- Mention validator names, options, and package APIs in backticks.
- Put compatibility, runtime, and security-related changes in explicit sections.
- Include test and build verification before publishing.
- Omit empty sections except `Breaking Changes`, which should explicitly say `None.` when applicable.
- Avoid vague entries such as "misc fixes" or "updates".

## Example

```md
## @hy_ong/zod-kit v0.2.9

### Highlights
- Added optional Taiwan ITFS/UIFN support to `twTel` through the `allowITFS` option.
- Strengthened URL local/private host blocking for IPv6 and IPv4-mapped IPv6 edge cases.
- Updated dependencies and build configuration while keeping the public API stable.

### Breaking Changes
- None.

### Added
- `twTel` can now validate Taiwan ITFS/UIFN numbers such as `00800`, `00801`, and `00809` when `allowITFS: true` is enabled.
- Added focused test coverage for Taiwan ITFS/UIFN formats, separator handling, and invalid length cases.

### Fixed
- Fixed ESM Day.js plugin imports for `date` and `datetime` validators.
- Fixed `file()` compatibility in runtimes where the global `File` constructor is unavailable, including Node.js 18.
- Fixed URL validation gaps for local/private hosts, including IPv6 link-local ranges and IPv4-mapped private/local IPv6 addresses.

### Changed
- Updated dependencies to their latest compatible versions.
- Updated TypeScript configuration for the current compiler behavior.
- Maintained backward-compatible behavior for existing validators.

### Documentation
- Corrected README examples for Taiwan validator exports.
- Corrected README password option documentation to match the implemented API.

### Verification
- `npm test -- --run` - 1137 tests passed.
- `npx eslint src/` - passed.
- `npx tsc --noEmit` - passed.
- `npm run build` - passed.
- `npm audit` - 0 vulnerabilities.
- `npm outdated` - no outdated dependencies reported.
```
