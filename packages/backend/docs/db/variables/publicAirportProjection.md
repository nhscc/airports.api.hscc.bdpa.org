[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / publicAirportProjection

# Variable: publicAirportProjection

> `const` **publicAirportProjection**: `object`

Defined in: [packages/backend/src/db.ts:312](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/f004616541a33433190943097b5a6b00f257295b/packages/backend/src/db.ts#L312)

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
