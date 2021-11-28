# BDPA Airports Public API

The live API used by solutions to the 2020 NHSCC problem statement. It was built
according to [JAMstack principles](https://jamstack.org/) using TypeScript
(JavaScript) and MongoDB. The production instance is hosted on
[Vercel](https://vercel.com) with [MongoDB
Atlas](https://www.mongodb.com/cloud/atlas). The code is highly documented. You
can clone this repo and run a fully functional version of this API locally
following the instructions below.

> This project has been tested on Linux (Kubuntu) and Windows 10 Pro with WSL2.
> If you encounter any issues (especially Windows-specific issues), please
> [report them](https://github.com/nhscc/airports.api.hscc.bdpa.org/issues/new).
> If you're on Windows and you're not using WSL, [start using
> WSL](https://docs.microsoft.com/en-us/windows/wsl/install-win10).

## Table of Contents

+ [Accessing the Production API](#accessing-the-production-api)
+ [Running a local instance of the API](#running-a-local-instance-of-the-api)
+ [Project structure](#project-structure)
  + [Files and directories](#files-and-directories)
  + [External scripts](#external-scripts)
  + [Administrator tools](#administrator-tools)
  + [Stochastic flight states](#stochastic-flight-states)
    + [Are gates and flight numbers
      unique?](#are-gates-and-flight-numbers-unique)
    + [Why does the API respond so slowly?](#why-does-the-api-respond-so-slowly)
+ [Contributing](#contributing)
  + [NPM Scripts](#npm-scripts)
    + [Development](#development)
    + [Building](#building)
    + [Publishing](#publishing)
    + [NPX](#npx)

## Accessing the Production API

- Version 1 root URI: https://airports.api.hscc.bdpa.org/v1
- Version 2 root URI: https://airports.api.hscc.bdpa.org/v2
- Version 1 documentation and playground with examples:
  https://hsccdfbb7244.docs.apiary.io
- Version 2 documentation and playground with examples:
  https://hscc210ff8c0.docs.apiary.io

Additionally, you can access the special administrator "tools" interface by
navigating to https://airports.api.hscc.bdpa.org/?tools. This UI is available
for local/development deployments as well. You will need an administrator key to
use it. If you choose to hydrate the database, see the `tool-keys` mongodb
collection to find one. [More on this below](#administrator-tools).

## Running a local instance of the API

You should be using the production API (and your real key) for your application.
However, for development purposes, you can also run a local version of the API
to make requests against. This API is entirely self-contained; everything you
need to run it locally is in this repo (except a running MongoDB instance).

To run a local instance of the API:

1. Ensure the latest [NodeJS](https://nodejs.org/en) and
   [MongoDB](https://docs.mongodb.com/manual/installation) are installed.
   * Typically, once you run their installers, no further configuration is
     required. Easy peasy!
   * If you're using WSL on Windows, [read
     this](https://docs.microsoft.com/en-us/windows/wsl/tutorials/wsl-database#install-mongodb).
   * Check out [MongoDB
        Compass](https://docs.mongodb.com/compass/master/install)!
2. Clone this repo using your favorite terminal.
3. From the terminal, with the repo as the current working directory, run `npm
   install`.
4. Copy the file `dist.env` to `.env`.
   * Add your MongoDB connect URI to the MONGODB_URI environment variable in
     `.env`.
      * Using `mongodb://127.0.0.1:27017/test` as the connect URI should work
        out of the box.
      * A valid URI looks something like this:
        `mongodb://your-server-uri:your-port-number/your-test-db-name`
      * It is important that you include **the name of the test database** after
        the slash (you can just make something up) like in the above examples.
   * Set `HYDRATE_DB_ON_STARTUP=true` in `.env` to have the database you
     specified in the connect URI automatically configured and hydrated.
     Alternatively, you can use the `generate-flights` [external
     script](#external-scripts).
5. At this point you should test that the API will work on your system. To do
   this, run the command `npm test` in your terminal.
6. If all tests passed, you can start up the API in development mode by running
   the `npm run dev` command.
7. If you set `HYDRATE_DB_ON_STARTUP=true` previously, navigate to the API's URI
   (details below) using your browser to finish setting up the database.
   * If you're using MongoDB Compass, you'll be able to visually explore the
     dummy database's data at this point.
8. You can now interact with the API using your browser,
   [Postman](https://www.postman.com/), or otherwise.
   * You should see a line on the console that looks like `ready - started
     server on http://<HOST:PORT>`. Use that URI at the end to access the API.

> Note: if you choose to run the API with NODE_ENV=production or `npm start`,
> the database will not be automatically setup nor (one-time) hydrated. Better
> to run the API in development mode (the default).

> Warning: if you've enabled the V1 API, the `"economy"` seat class MUST EXIST
> in the database (in the `info` collection, `seatClasses` array) or there will
> be undefined behavior when matching using `seatPrice` for `/flights/search`
> queries.

> Note: to generate stochastic flight states, you must hydrate the database.
> Stochastic flight states are generated one time only: when the API is run in
> development mode, `HYDRATE_DB_ON_STARTUP=true`, and the index page is
> accessed. In production, state generation functionality is provided by the
> `generate-flights` [external script](#external-scripts).

## Project structure

This project uses the following technologies:

- [Node and NPM](https://nodejs.org/en) to run JavaScript locally
- [TypeScript](https://www.typescriptlang.org/) for producing typed JavaScript
- [Babel](https://babeljs.io/) for compiling (transpiling) TypeScript + ESNext
  syntax
- [Gulp](https://www.npmjs.com/package/gulp) for running complex tasks
- [Git](https://git-scm.com/) for version control and deploying to production
- [ESLint](https://eslint.org/) for TypeScript and JavaScript linting
- [Webpack](https://webpack.js.org/) for tree-shaking and asset bundling
- [JSX](https://reactjs.org/docs/introducing-jsx.html),
  [React](https://reactjs.org/), and [Next](https://nextjs.org/) for modern web
  development
- [MongoDB](https://www.mongodb.com/) [Node
  driver](https://mongodb.github.io/node-mongodb-native) for database access
- [Jest](https://jestjs.io/) for unit and integration testing
- [API Blueprint](https://apiblueprint.org/) (APIB) for describing the API
- [JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON)
  (JavaScript Object Notation) for storing and transferring information

### Files and directories

The various `tsconfig.*.json` files control the TypeScript settings used when
[type checking]() the project, [building the docs](#npm-scripts), etc. Type
checks are run once before the project is built during production deployments,
otherwise they must be run manually (inconvenient) or by your IDE. If you're
using a modern IDE like [VS Code](https://code.visualstudio.com/) (highly
recommended!), you don't have to do anything as it's all handled for you.
`tsconfig.eslint.json` is a special TypeScript configuration file that extends
the normal `tsconfig.json` with a few extra settings specifically for ESLint.

`package.json` and `package-lock.json` are used by NPM to describe the
dependencies that will be automatically installed when executing `npm install`.

`next.config.js` and `gulpfile.js` are transpiled scripts and should generally
be ignored. You can find the real versions under the `config/` directory.
`config/gulpfile.ts` defines all the [Gulp](https://www.npmjs.com/package/gulp)
tasks that can be run. `config/next.config.ts` returns a JSON object used to
configure [Next](https://www.npmjs.com/package/next). If you make changes to
`config/gulpfile.ts` or `config/next.config.ts`, be sure to run `npm run
regenerate` afterwards to apply your changes.

`dist.env` is the [distributed environment
file](https://www.npmjs.com/package/dotenv). It's meaningless on its own, but
when copied and renamed to `.env`, it will be used by the API to define certain
environment variables.

The files listed in `.gitignore` are ignored when Git uploads your code to the
internet. This is useful for hiding secrets like the `.env` file.

`next-env.d.ts` is a TypeScript types file. It's a special type of JavaScript
file that globally defines TypeScript types used by other files. The `types/`
folder serves a similar purpose.

`LICENSE` is an [MIT](https://MIT.org) license file that says you
can do whatever you want with the code in this project. Be a good denizen of
open-source and set your code free!

`babel.config.js` returns a JSON object used to configure
[Babel](https://babeljs.io), our transpiler. `webpack.config.js` returns a JSON
object used to configure how [Webpack](https://webpack.js.org) builds the
[external scripts](#external-scripts). `jest.config.js` returns a JSON object
used to configure [Jest](https://jestjs.io), our [test
runner](https://jestjs.io/docs/en/getting-started). `.eslintrc.js` returns a
JSON object used to configure [ESLint](https://eslint.org), our code correctness
checker or "linter".

`V1API.apib` and `V2API.apib` are [APIB](https://apiblueprint.org) files used to
build the [Apiary](https://apiary.io)
[APIv1](https://hsccdfbb7244.docs.apiary.io) and
[APIv2](https://hscc210ff8c0.docs.apiary.io) documentation, respectively.

`lib/` contains TypeScript modules shared between projects. These are candidates
for becoming new NPM packages.

`src/` contains the source code of the application. `test` contains the unit and
integration tests for the API. `src/backend` contains backend business logic and
the database ORM layer (kept thin thanks to MongoDB). `src/frontend` contains
frontend business logic and the API client ORM layer for the API's tools UI.
`src/pages` contains React (JSX) TypeScript code (`.tsx` files). `src/pages/api`
contains the actual API endpoints. The directories and files are so named to
take advantage of [Next dynamic
routing](https://nextjs.org/docs/routing/dynamic-routes).

`external-scripts/` contains the source code for all the [external
scripts](#external-scripts). `external-scripts/bin/` is created when running
`npm run build-externals`, which compiles the scripts in `external-scripts/`
into `external-scripts/bin/`.

### External scripts

The files found under `external-scripts/bin` are independently bundled
standalone executables meant to be invoked manually by processes external to the
app itself (usually as cron jobs).

These scripts must be configured using the appropriate `.env` variables. See
`dist.env` for details.

You can use the [NPM run script](#npm-scripts) to build any external scripts.
The executable will be placed in `external-scripts/bin`:

```Bash
npm run build-externals
```

> Warning: when you change `.env` you must (re-)build external scripts using the
> above command.

All executables under `external-scripts/bin` can be run like so:

```Bash
node external-scripts/bin/script-name-here.js
```

Currently, the following external scripts exist:

- `generate-flights.js` - Responsible for generating new flights for the
  database. Should be run every week or two.
- `prune-logs.js` - Responsible for ensuring the mongodb request-log collection
  never grows too large. Should be run every hour or so.
- `ban-hammer.js` - Responsible for rate limiting (banning) keys and ips that
  hit the API too often. Should be run every minute.

### Administrator tools

This interface is used by judges and testers to control how the API responds to
requests from specific API keys. You can access the admin tools interface by
navigating to `http://<HOST:PORT>/?tools`.

Currently, the following tools are available:

- `Tool 1: todo` - todo
- `Tool 2: todo` - todo
- `Tool 3: todo` - todo

### Stochastic flight states

Or: *how are flight gates and statuses changing automatically in the db?*

Flights are generated between 1 and 30 days in advance of their arrival time
(i.e. `arriveAtReceiver`). When a flight is generated, every single state it
will enter into, from being cancelled to being delayed to arriving to boarding,
is also generated using a [Markov
process](https://en.wikipedia.org/wiki/Markov_chain) depending on its `type`.
Afterwards, using an [aggregation
pipeline](https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline),
one of these states is selected every time an API request is made. The state
that gets selected depends on the time the request is received. This means
flight data isn't actually "changing" "randomly" (i.e. stochastically) in the
database. It only looks that way.

These states, made up of `arriveAtReceiver`, `gate`, `status`, and
`departFromReceiver`, are generated and stored according to the following rules:

All flights start off in a state where their status is <span style="color:
rgb(31, 119, 180)">*scheduled* (**A**)</span>, meaning they are scheduled to
arrive at their `landingAt` airport (at `arriveAtReceiver` time) coming in from
their `comingFrom` airport (at `departFromSender` time). Once `departFromSender`
time elapses, there's an 80% chance the flight status becomes <span
style="color: rgb(255, 127, 14)">*on time* (**B**)</span> and a 20% chance the
flight status becomes <span style="color: rgb(44, 160, 44)">*cancelled*
(**C**)</span>. Once a flight is cancelled, it no longer changes states in the
system.

At some point before `arriveAtReceiver` but after `departFromSender`, there is a
20% chance the flight status becomes <span style="color: rgb(214, 39,
40)">*delayed* (**D**)</span>, pushing `arriveAtReceiver` back by 15 minutes.
Between 15 minutes and 2 hours before `arriveAtReceiver` elapses (but after the
flight is or isn't delayed), the flight's arrival gate is chosen and visible in
the API <span style="color: rgb(148, 103, 189)">(**E**)</span>.

After the flight's arrival gate is chosen, between 5 and 30 minutes before
`arriveAtReceiver`, the flight's status becomes <span style="color: rgb(140, 86,
75)">*landed* (**F**)</span>. Immediately, there's a 50% chance <span
style="color: rgb(227, 119, 194)">*the gate changes* (**G**)</span>.

Once `arriveAtReceiver` elapses, the flight's status becomes <span style="color:
rgb(127, 127, 127)">*arrived* (**H**)</span>. Immediately, there is a 15% chance
<span style="color: rgb(188, 189, 34)">*the gate changes* (**I**)</span>.

***

If the flight is an **arrival** (`type` is `arrival`), upon the next hour, the
flight's status becomes <span style="color: rgb(23, 190, 207)">*past*
(**J**)</span> and no longer changes states in the system.

![The Markov model describing how flight states update](markov-arrivals.png
"Stochastic state flight update markov chain for arrivals")

***

If, on the other hand, the flight is a **departure** (`type` is `departure`),
between 3 and 10 minutes after the flight's status becomes `arrived`, the
flight's status becomes <span style="color: rgb(23, 190, 207)">*boarding*
(**J**)</span>.

Once `departFromReceiver` elapses, the flight's status becomes <span
style="color: rgb(31, 119, 180)">*boarding* (**K**)</span>. 2 to 5 hours after
that, the flight's status becomes <span style="color: rgb(255, 127, 14)">*past*
(**L**)</span> and no longer changes states in the system.

![The Markov model describing how flight states update](markov-departures.png
"Stochastic state flight update markov chain for departures")

#### Are gates and flight numbers unique?

Gates and flight numbers are unique **but only per airport per hour**. Hence,
two or more flights in the same several-hour span might have the same flight
number or land at the same gate at the same airport, but never within the same
hour.

#### Why does the API respond so slowly?

The API responds slowly for certain queries due to how each flight's stochastic
states are stored. Since they're nested within the rest of the flight data
(under the `stochasticStates` field) and the correct state is selected through
an [aggregation
pipeline](https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline),
[the current state of the flight is not
indexable](https://docs.mongodb.com/manual/core/aggregation-pipeline/#pipeline-operators-and-indexes).
Not being able to generate indices on the stochastic state fields slows down
searches involving those fields (like `arriveAtReceiver`, `status`, and `gate`)
by an order of magnitude.

The obvious solution is to break the stochastic states out into their own
collection and index them there; however, we decided to leave the stochastic
states nested within each flight document since it made it easy for the judges
to see [how apps behave while waiting several seconds for a
response](https://reactjs.org/docs/concurrent-mode-suspense.html).

tl;dr "It's a feature, not a bug!"

## Contributing

**New issues and pull requests are always welcome and greatly appreciated!** If
you submit a pull request, take care to maintain the existing coding style and
add unit tests for any new or changed functionality. Please lint and test your
code, of course!

### NPM Scripts

Run `npm run list-tasks` to see which of the following scripts are available for
this project.

> Using these scripts requires a linux-like development environment. None of the
> scripts are likely to work on non-POSIX environments. If you're on Windows,
> use [WSL](https://docs.microsoft.com/en-us/windows/wsl/install-win10).

#### Development

- `npm run repl` to run a buffered TypeScript-Babel REPL
- `npm test` to run the unit tests and gather test coverage data
  - Look for HTML files under `coverage/`
- `npm run check-build` to run the integration tests
- `npm run check-types` to run a project-wide type check
- `npm run test-repeat` to run the entire test suite 100 times
  - Good for spotting bad async code and heisenbugs
  - Uses `__test-repeat` NPM script under the hood
- `npm run dev` to start a development server or instance
- `npm run generate` to transpile config files (under `config/`) from scratch
- `npm run regenerate` to quickly re-transpile config files (under `config/`)

#### Building

- `npm run clean` to delete all build process artifacts
- `npm run build` to compile `src/` into `dist/`, which is what makes it into
  the published package
- `npm run build-docs` to re-build the documentation
- `npm run build-externals` to compile `external-scripts/` into
  `external-scripts/bin/`
- `npm run build-stats` to gather statistics about Webpack (look for
  `bundle-stats.json`)

#### Publishing

- `npm run start` to start a production instance
- `npm run fixup` to run pre-publication tests, rebuilds (like documentation),
  and validations
  - Triggered automatically by
    [publish-please](https://www.npmjs.com/package/publish-please)

#### NPX

- `npx publish-please` to publish the package
- `npx sort-package-json` to consistently sort `package.json`
- `npx npm-force-resolutions` to forcefully patch security audit problems
