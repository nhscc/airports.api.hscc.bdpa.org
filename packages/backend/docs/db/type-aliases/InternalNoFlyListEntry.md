[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / InternalNoFlyListEntry

# Type Alias: InternalNoFlyListEntry

> **InternalNoFlyListEntry** = `WithId`\<\{ `birthdate`: \{ `day`: `number`; `month`: `number`; `year`: `number`; \}; `name`: \{ `first`: `string`; `last`: `string`; `middle`: `string` \| `null`; \}; `sex`: `"male"` \| `"female"`; \}\>

Defined in: [packages/backend/src/db.ts:216](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/b470f9c9d96f6b35b8590436385b9275ea3cbfa3/packages/backend/src/db.ts#L216)

The shape of an internal no-fly-list entry.
