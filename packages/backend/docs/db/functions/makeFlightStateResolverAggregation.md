[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / makeFlightStateResolverAggregation

# Function: makeFlightStateResolverAggregation()

> **makeFlightStateResolverAggregation**(`__namedParameters`): (\{ `$addFields`: \{ `bookable`: \{ `$cond`: \{ `else`: `boolean`; `if`: \{ `$and`: `object`[]; \}; `then`: `boolean`; \}; \}; `flight_id`: \{ `$toString`: `string`; \}; `state`: \{ `$arrayElemAt`: (`number` \| \{ `$filter`: \{ `as`: `string`; `cond`: \{ `$lte`: ...[]; \}; `input`: \{ `$objectToArray`: `string`; \}; \}; \})[]; \}; \}; `$project?`: `undefined`; `$replaceRoot?`: `undefined`; \} \| \{ `$addFields?`: `undefined`; `$project?`: `undefined`; `$replaceRoot`: \{ `newRoot`: \{ `$mergeObjects`: `string`[]; \}; \}; \} \| \{ `$addFields?`: `undefined`; `$project`: \{ `_id?`: `boolean`; `bookerAuthId`: `boolean`; `state`: `boolean`; `stochasticStates`: `boolean`; \}; `$replaceRoot?`: `undefined`; \})[]

Defined in: [packages/backend/src/db.ts:346](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/f004616541a33433190943097b5a6b00f257295b/packages/backend/src/db.ts#L346)

Returns a MongoDB Aggregation that resolves [InternalFlight](../type-aliases/InternalFlight.md)s into
[PublicFlight](../type-aliases/PublicFlight.md)s, i.e. their current "stochastic" states.

## Parameters

### \_\_namedParameters

#### bookerAuthId

`string`

#### removeIdsFromResult

`boolean`

## Returns

(\{ `$addFields`: \{ `bookable`: \{ `$cond`: \{ `else`: `boolean`; `if`: \{ `$and`: `object`[]; \}; `then`: `boolean`; \}; \}; `flight_id`: \{ `$toString`: `string`; \}; `state`: \{ `$arrayElemAt`: (`number` \| \{ `$filter`: \{ `as`: `string`; `cond`: \{ `$lte`: ...[]; \}; `input`: \{ `$objectToArray`: `string`; \}; \}; \})[]; \}; \}; `$project?`: `undefined`; `$replaceRoot?`: `undefined`; \} \| \{ `$addFields?`: `undefined`; `$project?`: `undefined`; `$replaceRoot`: \{ `newRoot`: \{ `$mergeObjects`: `string`[]; \}; \}; \} \| \{ `$addFields?`: `undefined`; `$project`: \{ `_id?`: `boolean`; `bookerAuthId`: `boolean`; `state`: `boolean`; `stochasticStates`: `boolean`; \}; `$replaceRoot?`: `undefined`; \})[]
