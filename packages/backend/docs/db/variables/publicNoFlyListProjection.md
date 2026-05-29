[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / publicNoFlyListProjection

# Variable: publicNoFlyListProjection

> `const` **publicNoFlyListProjection**: `object`

Defined in: [packages/backend/src/db.ts:332](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/09913e8dcd16836d62112704c3b5912d8298d63b/packages/backend/src/db.ts#L332)

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
