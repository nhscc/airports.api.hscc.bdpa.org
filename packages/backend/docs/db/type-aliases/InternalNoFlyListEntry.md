[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / InternalNoFlyListEntry

# Type Alias: InternalNoFlyListEntry

> **InternalNoFlyListEntry** = `WithId`\<\{ `birthdate`: \{ `day`: `number`; `month`: `number`; `year`: `number`; \}; `name`: \{ `first`: `string`; `last`: `string`; `middle`: `string` \| `null`; \}; `sex`: `"male"` \| `"female"`; \}\>

Defined in: [packages/backend/src/db.ts:214](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/f004616541a33433190943097b5a6b00f257295b/packages/backend/src/db.ts#L214)

The shape of an internal no-fly-list entry.
