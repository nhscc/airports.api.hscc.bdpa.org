# BDPA Airports Public API

The live API used by solutions to the 2019 NHSCC problem statement. It was built
according to [JAMstack principles](https://jamstack.org/) using TypeScript
(JavaScript) and MongoDB. The production instance is hosted on
[Vercel](https://vercel.com) with [MongoDB
Atlas](https://www.mongodb.com/cloud/atlas). The code is highly documented. You
can clone this repo and run a fully functional version of this API locally
following the instructions below.

If you run into any issues or find any bugs, please [report
them](https://github.com/nhscc/airports.api.hscc.bdpa.org/issues/new)!

Root URI: https://airports.api.hscc.bdpa.org/v1  
Documentation and playground with examples: https://airportshscc.docs.apiary.io

## Running a local version of the API

You should be using the production version of the API (and your key) for your
application. However, for development purposes, you can also run a local version
of the API to make requests against. This API is self-contained aside from
MongoDB; everything you need to run it locally is in this repo (except a running
MongoDB instance). Follow the instructions below:

> This project has been tested on Linux (Kubuntu) and Windows 10 Pro. If you
> encounter any issues (especially Windows-specific issues), please [report
> them](https://github.com/nhscc/airports.api.hscc.bdpa.org/issues/new).

1. Ensure the latest [NodeJS](https://nodejs.org/en/) and
   [MongoDB](https://docs.mongodb.com/manual/installation/) are installed and
   set up.
2. Clone this repo using your favorite terminal
3. From the terminal, with the repo as the current working directory, run `npm
   install`
   * If you're on Windows, you should also run `npm install -g gulp-cli` before
     continuing
4. Copy the file `dist.env` to `.env`
   * [Install MongoDB](https://www.mongodb.com/download-center/community) if you
     have not already and start it up
      * If you're on Windows, you might also be interested in MongoDB Compass
        (bundled with the installer)
   * Add your MongoDB connect URI to the MONGODB_URI environment variable in
     `.env`
      * The URI should look like this:
        `mongodb://localhost:your-port-number/my-test-db-name`, i.e.
        `mongodb://localhost:27017/test`
      * It is important that you include the name of the test database after the
        slash (you can just make something up) like in the above examples
   * Set `HYDRATE_DB_ON_STARTUP=true` in `.env` to have the database you
     specified in the connect URI automatically configured and hydrated
5. At this point you should test that the API will work on your system. To do
   this, run the command `npm test` in your terminal
6. If all tests passed, you can start up the API in development mode by running
   the `npm run dev` command
   * If you're on Windows, run `npm run dev-windows` instead!
7. If you set `HYDRATE_DB_ON_STARTUP=true` previously, navigate to the API's URI
   (details below) using your browser to finish setting up the database
   * If you're using MongoDB Compass, you'll be able to visually explore the
     dummy database's data
8. You can now interact with the API using your browser,
   [Postman](https://www.postman.com/), or otherwise
   * You should see a line on the console that looks like `ready - started
     server on <URI HERE>`. Use that URI to access the API.

> Note: if you choose to run the API with NODE_ENV=production or `npm start`,
> the database will not be automatically setup nor hydrated. Better to run the
> API in development mode (the default).

## Available commands

To get a list of possible actions, run the following from your terminal:

```
$ npm run list-tasks
```

## Project structure

This API uses the following technologies:

- Node and NPM to run JavaScript locally
- [TypeScript](https://www.typescriptlang.org/) for producing typed JavaScript
- Babel for compiling (transpiling) TypeScript + ESNext syntax
- Gulp for running complex tasks
- Git for version control
- ESLint for TypeScript and JavaScript linting
- [Webpack](https://webpack.js.org/) for tree-shaking and asset bundling
- JSX, [React](https://reactjs.org/), and [Next](https://nextjs.org/) for modern
  web development
- MongoDB Node driver for database access
- [Jest](https://jestjs.io/) for unit and integration testing

### Files and directories

`tsconfig` controls the TypeScript settings used when *type checking* the
project. Type checks are run once before the project is built during production
deployments, otherwise they must be run manually (inconvenient) or by your IDE.
If you're using a modern IDE like [vscode](https://code.visualstudio.com/)
(highly recommended!), you don't have to do anything as it's all handled for
you.

`package.json` and `package-lock.json` are used by NPM to describe the
dependencies that will be automatically installed when executing `npm install`.

`next.config.js` and `gulpfile.js` are transpiled scripts and should generally
be ignored. You can find the real versions under the `config/` directory.
`config/gulpfile.ts` defines all the Gulp tasks that can be run.
`config/next.config.ts` returns a JSON object used to configure Next. If you
make changes to `config/gulpfile.ts` or `config/next.config.ts`, be sure to run
`npm run regenerate` afterwards to apply your changes.

`dist.env` is the distributed environment file. It's meaningless on its own, but
when copied and renamed to `.env`, it will be used by the API to define certain
environment variables.

`next-env.d.ts` is a TypeScript types file. It's a special type of JavaScript
file that globally defines TypeScript types used by other files. The `types/`
folder serves a similar purpose.

`babel.config.js` returns a JSON object used to configure Babel.

`lib/` contains TypeScript modules shared between projects.

`src/` contains the source code of the application. `src/__test__` contains the
unit and integration tests for the API. `src/backend` contains business logic
and the database ORM layer (kept thin thanks to MongoDB). `src/pages` contains
React (JSX) TypeScript code (`.tsx` files). `src/pages/api` contains the actual
API endpoints. The directories and files are so named to take advantage of [Next
dynamic routing](https://nextjs.org/docs/routing/dynamic-routes).
