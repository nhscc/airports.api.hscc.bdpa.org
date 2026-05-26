[**@nhscc/backend-airports**](../../README.md)

***

[@nhscc/backend-airports](../../README.md) / [db](../README.md) / NewQuestion

# Type Alias: NewQuestion

> **NewQuestion** = `Omit`\<`WithoutId`\<[`InternalQuestion`](InternalQuestion.md)\>, `"createdAt"` \| `"title-lowercase"` \| `"status"` \| `"hasAcceptedAnswer"` \| `"upvotes"` \| `"upvoterUsernames"` \| `"downvotes"` \| `"downvoterUsernames"` \| `"answers"` \| `"answerItems"` \| `"comments"` \| `"commentItems"` \| `"views"` \| `"sorter"`\>

Defined in: [packages/backend/src/db.ts:237](https://github.com/nhscc/airports.api.hscc.bdpa.org/blob/e58635515aaccbecfff868b37cbae9a64bb762c2/packages/backend/src/db.ts#L237)

The shape of a new question.
