[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / PublicFlight

# Type Alias: PublicFlight

> **PublicFlight** = `WithoutId`\<`Omit`\<[`InternalFlight`](InternalFlight.md), `"bookerKey"` \| `"stochasticStates"`\>\> & [`StochasticFlightState`](StochasticFlightState.md) & `object`

Defined in: [packages/backend/src/db.ts:173](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/d631ba318d3e65370cee148ae59953ef059cface/packages/backend/src/db.ts#L173)

The shape of a public flight.

## Type Declaration

### bookable

> **bookable**: `boolean`

### flight\_id

> **flight\_id**: `string`
