[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / toPublicFlight

# Function: toPublicFlight()

> **toPublicFlight**(`flight`, `auth_id`): [`PublicFlight`](../type-aliases/PublicFlight.md)

Defined in: [packages/backend/src/db.ts:246](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/9f0680e2ff55e82b02cce781e2f3d87b84a665f2/packages/backend/src/db.ts#L246)

Transforms an [InternalFlight](../type-aliases/InternalFlight.md) into a [PublicFlight](../type-aliases/PublicFlight.md) for the V2
API.

## Parameters

### flight

[`InternalFlight`](../type-aliases/InternalFlight.md)

### auth\_id

`string`

## Returns

[`PublicFlight`](../type-aliases/PublicFlight.md)
