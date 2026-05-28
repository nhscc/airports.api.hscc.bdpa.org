[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [env](../README.md) / overwriteEnv

# Function: overwriteEnv()

> **overwriteEnv**(`overrides`): `void`

Defined in: [packages/backend/src/env.ts:32](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/1383f8724fc00a6938af314b7485a04ed5ccb3a2/packages/backend/src/env.ts#L32)

Set an internal `overrides` object that will be merged over any environment
variables coming from `process.env`. The values of `overrides` _must_ be in
their final form, e.g. of type `number` (✅ `42`) instead of a string (🚫
`"42"`), the latter being what the real `process.env` would provide but that
this function does not support.

This function should only be used in a multitenant situation where relying on
exclusive access to `process.env` is not possible (e.g. `@nhscc/bdpa-cli`).

## Parameters

### overrides

`Environment`

## Returns

`void`
