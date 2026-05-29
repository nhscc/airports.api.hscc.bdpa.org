[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / toPublicFlight

# Function: toPublicFlight()

> **toPublicFlight**(`flight`, `requestAuthId`): [`PublicFlight`](../type-aliases/PublicFlight.md)

Defined in: [packages/backend/src/db.ts:237](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/f004616541a33433190943097b5a6b00f257295b/packages/backend/src/db.ts#L237)

Transforms an [InternalFlight](../type-aliases/InternalFlight.md) into a [PublicFlight](../type-aliases/PublicFlight.md) for the V2
API.

## Parameters

### flight

[`InternalFlight`](../type-aliases/InternalFlight.md)

### requestAuthId

`string`

## Returns

[`PublicFlight`](../type-aliases/PublicFlight.md)
