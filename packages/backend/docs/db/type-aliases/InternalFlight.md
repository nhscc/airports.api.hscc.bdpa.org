[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / InternalFlight

# Type Alias: InternalFlight

> **InternalFlight** = `WithId`\<\{ `airline`: `string`; `baggage`: \{ `carry`: \{ `max`: `number`; `prices`: `number`[]; \}; `checked`: \{ `max`: `number`; `prices`: `number`[]; \}; \}; `bookerKey`: `string` \| `null`; `comingFrom`: `string`; `departingTo`: `string` \| `null`; `extras`: \{\[`name`: `string`\]: `object`; \}; `ffms`: `number`; `flightNumber`: [`FlightNumber`](FlightNumber.md); `landingAt`: `string`; `seats`: \{\[`seatClass`: `string`\]: `object`; \}; `stochasticStates`: \{\[`activeAfter`: `string`\]: [`StochasticFlightState`](StochasticFlightState.md); \}; `type`: `"arrival"` \| `"departure"`; \}\>

Defined in: [packages/backend/src/db.ts:132](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/1383f8724fc00a6938af314b7485a04ed5ccb3a2/packages/backend/src/db.ts#L132)

The shape of an internal flight.
