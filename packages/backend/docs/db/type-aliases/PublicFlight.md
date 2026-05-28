[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / PublicFlight

# Type Alias: PublicFlight

> **PublicFlight** = `WithoutId`\<`Omit`\<[`InternalFlight`](InternalFlight.md), `"bookerKey"` \| `"stochasticStates"`\>\> & [`StochasticFlightState`](StochasticFlightState.md) & `object`

Defined in: [packages/backend/src/db.ts:173](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/729006e855b829bf84928331492bcc92064f3981/packages/backend/src/db.ts#L173)

The shape of a public flight.

## Type Declaration

### bookable

> **bookable**: `boolean`

### flight\_id

> **flight\_id**: `string`
