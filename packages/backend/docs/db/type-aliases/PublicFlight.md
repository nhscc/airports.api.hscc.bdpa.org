[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / PublicFlight

# Type Alias: PublicFlight

> **PublicFlight** = `WithoutId`\<`Omit`\<[`InternalFlight`](InternalFlight.md), `"bookerKey"` \| `"stochasticStates"`\>\> & [`StochasticFlightState`](StochasticFlightState.md) & `object`

Defined in: [packages/backend/src/db.ts:175](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/b470f9c9d96f6b35b8590436385b9275ea3cbfa3/packages/backend/src/db.ts#L175)

The shape of a public flight.

## Type Declaration

### bookable

> **bookable**: `boolean`

### flight\_id

> **flight\_id**: `string`
