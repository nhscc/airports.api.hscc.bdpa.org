[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / PublicFlight

# Type Alias: PublicFlight

> **PublicFlight** = `WithoutId`\<`Omit`\<[`InternalFlight`](InternalFlight.md), `"bookerKey"` \| `"stochasticStates"`\>\> & [`StochasticFlightState`](StochasticFlightState.md) & `object`

Defined in: [packages/backend/src/db.ts:173](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/1383f8724fc00a6938af314b7485a04ed5ccb3a2/packages/backend/src/db.ts#L173)

The shape of a public flight.

## Type Declaration

### bookable

> **bookable**: `boolean`

### flight\_id

> **flight\_id**: `string`
