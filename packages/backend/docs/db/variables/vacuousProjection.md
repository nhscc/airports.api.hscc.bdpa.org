[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / vacuousProjection

# Variable: vacuousProjection

> `const` **vacuousProjection**: `object`

Defined in: [packages/backend/src/db.ts:557](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/e58635515aaccbecfff868b37cbae9a64bb762c2/packages/backend/src/db.ts#L557)

A meaningless MongoDB cursor projection used for existence checking without
wasting the bandwidth to pull down all of the data that might be embedded
within an object's fields.

## Type declaration

### exists

> **exists**: `object`

#### exists.$literal

> **$literal**: `boolean` = `true`
