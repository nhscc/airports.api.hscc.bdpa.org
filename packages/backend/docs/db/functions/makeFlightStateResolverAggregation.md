[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / makeFlightStateResolverAggregation

# Function: makeFlightStateResolverAggregation()

> **makeFlightStateResolverAggregation**(`__namedParameters`): (\{ `$addFields`: \{ `bookable`: \{ `$cond`: \{ `else`: `boolean`; `if`: \{ `$and`: `object`[]; \}; `then`: `boolean`; \}; \}; `flight_id`: \{ `$toString`: `string`; \}; `state`: \{ `$arrayElemAt`: (`number` \| \{ `$filter`: \{ `as`: `string`; `cond`: \{ `$lte`: ...[]; \}; `input`: \{ `$objectToArray`: `string`; \}; \}; \})[]; \}; \}; `$project?`: `undefined`; `$replaceRoot?`: `undefined`; \} \| \{ `$addFields?`: `undefined`; `$project?`: `undefined`; `$replaceRoot`: \{ `newRoot`: \{ `$mergeObjects`: `string`[]; \}; \}; \} \| \{ `$addFields?`: `undefined`; `$project`: \{ `_id?`: `boolean`; `bookerKey`: `boolean`; `state`: `boolean`; `stochasticStates`: `boolean`; \}; `$replaceRoot?`: `undefined`; \})[]

Defined in: [packages/backend/src/db.ts:343](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/09913e8dcd16836d62112704c3b5912d8298d63b/packages/backend/src/db.ts#L343)

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
