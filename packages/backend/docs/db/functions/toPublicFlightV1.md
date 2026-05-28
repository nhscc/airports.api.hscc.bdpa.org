[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / toPublicFlightV1

# Function: toPublicFlightV1()

> **toPublicFlightV1**(`flight`): `object`

Defined in: [packages/backend/src/db.ts:259](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/1383f8724fc00a6938af314b7485a04ed5ccb3a2/packages/backend/src/db.ts#L259)

Transforms an [PublicFlight](../type-aliases/PublicFlight.md) for the V2 API into a [PublicFlight](../type-aliases/PublicFlight.md)
for the V1 API.

## Parameters

### flight

[`PublicFlight`](../type-aliases/PublicFlight.md)

## Returns

`object`

### airline

> **airline**: `string`

### arriveAtReceiver

> **arriveAtReceiver**: `number`

### bookable

> **bookable**: `boolean`

### comingFrom

> **comingFrom**: `string`

### departFromReceiver

> **departFromReceiver**: `number` \| `null`

### departFromSender

> **departFromSender**: `number`

### departingTo

> **departingTo**: `string` \| `null`

### flight\_id

> **flight\_id**: `string`

### flightNumber

> **flightNumber**: `string`

### gate

> **gate**: `string` \| `null`

### landingAt

> **landingAt**: `string`

### seatPrice

> **seatPrice**: `number`

### status

> **status**: `"past"` \| `"scheduled"` \| `"cancelled"` \| `"delayed"` \| `"on time"` \| `"landed"` \| `"arrived"` \| `"boarding"` \| `"departed"`

### type

> **type**: `"arrival"` \| `"departure"`
