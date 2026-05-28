[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / InternalNoFlyListEntry

# Type Alias: InternalNoFlyListEntry

> **InternalNoFlyListEntry** = `WithId`\<\{ `birthdate`: \{ `day`: `number`; `month`: `number`; `year`: `number`; \}; `name`: \{ `first`: `string`; `last`: `string`; `middle`: `string` \| `null`; \}; `sex`: `"male"` \| `"female"`; \}\>

Defined in: [packages/backend/src/db.ts:214](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/1383f8724fc00a6938af314b7485a04ed5ccb3a2/packages/backend/src/db.ts#L214)

The shape of an internal no-fly-list entry.
