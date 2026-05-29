[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / publicAirportProjection

# Variable: publicAirportProjection

> `const` **publicAirportProjection**: `object`

Defined in: [packages/backend/src/db.ts:309](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/09913e8dcd16836d62112704c3b5912d8298d63b/packages/backend/src/db.ts#L309)

A MongoDB cursor projection that transforms an [InternalAirport](../type-aliases/InternalAirport.md) into a
[PublicAirport](../type-aliases/PublicAirport.md).

## Type Declaration

### \_id

> `readonly` **\_id**: `false` = `false`

### city

> `readonly` **city**: `true` = `true`

### country

> `readonly` **country**: `true` = `true`

### name

> `readonly` **name**: `true` = `true`

### shortName

> `readonly` **shortName**: `true` = `true`

### state

> `readonly` **state**: `true` = `true`
