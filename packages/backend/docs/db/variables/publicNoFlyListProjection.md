[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / publicNoFlyListProjection

# Variable: publicNoFlyListProjection

> `const` **publicNoFlyListProjection**: `object`

Defined in: [packages/backend/src/db.ts:341](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/9f0680e2ff55e82b02cce781e2f3d87b84a665f2/packages/backend/src/db.ts#L341)

A MongoDB cursor projection that transforms an [InternalNoFlyListEntry](../type-aliases/InternalNoFlyListEntry.md)
into a [PublicNoFlyListEntry](../type-aliases/PublicNoFlyListEntry.md)

## Type Declaration

### \_id

> `readonly` **\_id**: `false` = `false`

### birthdate

> `readonly` **birthdate**: `true` = `true`

### name

> `readonly` **name**: `true` = `true`

### sex

> `readonly` **sex**: `true` = `true`
