[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / publicNoFlyListProjection

# Variable: publicNoFlyListProjection

> `const` **publicNoFlyListProjection**: `object`

Defined in: [packages/backend/src/db.ts:334](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/c20d5d9fc2d2d1a784d1d934be931ba08894632f/packages/backend/src/db.ts#L334)

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
