[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / makeFlightStateResolverAggregation

# Function: makeFlightStateResolverAggregation()

> **makeFlightStateResolverAggregation**(`__namedParameters`): (\{ `$addFields`: \{ `bookable`: \{ `$cond`: \{ `else`: `boolean`; `if`: \{ `$and`: `object`[]; \}; `then`: `boolean`; \}; \}; `flight_id`: \{ `$toString`: `string`; \}; `state`: \{ `$arrayElemAt`: (`number` \| \{ `$filter`: \{ `as`: `string`; `cond`: \{ `$lte`: ...[]; \}; `input`: \{ `$objectToArray`: `string`; \}; \}; \})[]; \}; \}; `$project?`: `undefined`; `$replaceRoot?`: `undefined`; \} \| \{ `$addFields?`: `undefined`; `$project?`: `undefined`; `$replaceRoot`: \{ `newRoot`: \{ `$mergeObjects`: `string`[]; \}; \}; \} \| \{ `$addFields?`: `undefined`; `$project`: \{ `_id?`: `boolean`; `bookerKey`: `boolean`; `state`: `boolean`; `stochasticStates`: `boolean`; \}; `$replaceRoot?`: `undefined`; \})[]

Defined in: [packages/backend/src/db.ts:345](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/b470f9c9d96f6b35b8590436385b9275ea3cbfa3/packages/backend/src/db.ts#L345)

Returns a MongoDB Aggregation that resolves [InternalFlight](../type-aliases/InternalFlight.md)s into
[PublicFlight](../type-aliases/PublicFlight.md)s, i.e. their current "stochastic" states.

## Parameters

### \_\_namedParameters

#### bookerKey

`string`

#### removeIdsFromResult

`boolean`

## Returns

(\{ `$addFields`: \{ `bookable`: \{ `$cond`: \{ `else`: `boolean`; `if`: \{ `$and`: `object`[]; \}; `then`: `boolean`; \}; \}; `flight_id`: \{ `$toString`: `string`; \}; `state`: \{ `$arrayElemAt`: (`number` \| \{ `$filter`: \{ `as`: `string`; `cond`: \{ `$lte`: ...[]; \}; `input`: \{ `$objectToArray`: `string`; \}; \}; \})[]; \}; \}; `$project?`: `undefined`; `$replaceRoot?`: `undefined`; \} \| \{ `$addFields?`: `undefined`; `$project?`: `undefined`; `$replaceRoot`: \{ `newRoot`: \{ `$mergeObjects`: `string`[]; \}; \}; \} \| \{ `$addFields?`: `undefined`; `$project`: \{ `_id?`: `boolean`; `bookerKey`: `boolean`; `state`: `boolean`; `stochasticStates`: `boolean`; \}; `$replaceRoot?`: `undefined`; \})[]
