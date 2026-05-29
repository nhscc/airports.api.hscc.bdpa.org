[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / InternalFlight

# Type Alias: InternalFlight

> **InternalFlight** = `WithId`\<\{ `airline`: `string`; `baggage`: \{ `carry`: \{ `max`: `number`; `prices`: `number`[]; \}; `checked`: \{ `max`: `number`; `prices`: `number`[]; \}; \}; `bookerAuthId`: `string` \| `null`; `comingFrom`: `string`; `departingTo`: `string` \| `null`; `extras`: \{\[`name`: `string`\]: `object`; \}; `ffms`: `number`; `flightNumber`: [`FlightNumber`](FlightNumber.md); `landingAt`: `string`; `seats`: \{\[`seatClass`: `string`\]: `object`; \}; `stochasticStates`: \{\[`activeAfter`: `string`\]: [`StochasticFlightState`](StochasticFlightState.md); \}; `type`: `"arrival"` \| `"departure"`; \}\>

Defined in: [packages/backend/src/db.ts:133](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/f004616541a33433190943097b5a6b00f257295b/packages/backend/src/db.ts#L133)

The shape of an internal flight.
