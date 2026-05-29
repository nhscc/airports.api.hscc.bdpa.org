[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / publicAirportProjection

# Variable: publicAirportProjection

> `const` **publicAirportProjection**: `object`

Defined in: [packages/backend/src/db.ts:311](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/c20d5d9fc2d2d1a784d1d934be931ba08894632f/packages/backend/src/db.ts#L311)

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
