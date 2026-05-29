[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / InternalNoFlyListEntry

# Type Alias: InternalNoFlyListEntry

> **InternalNoFlyListEntry** = `WithId`\<\{ `birthdate`: \{ `day`: `number`; `month`: `number`; `year`: `number`; \}; `name`: \{ `first`: `string`; `last`: `string`; `middle`: `string` \| `null`; \}; `sex`: `"male"` \| `"female"`; \}\>

Defined in: [packages/backend/src/db.ts:223](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/9f0680e2ff55e82b02cce781e2f3d87b84a665f2/packages/backend/src/db.ts#L223)

The shape of an internal no-fly-list entry.
