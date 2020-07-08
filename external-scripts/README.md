# External scripts

These are external/auxiliary scripts and tools not used by the app directly but
used by periphery services like cron jobs and the like.

# Building generate-flights

Use the following with this directory as the current working directory:

```
npx @zeit/ncc build generate-flights.ts --out bin
```

You can also use handy NPM run script:

```
npm run build-externals
```
