# `@stash-it/postgresql-adapter`

![logo-stash-it-color-dark 2x](https://user-images.githubusercontent.com/1819138/30385483-99fd209c-98a7-11e7-85e2-595791d8d894.png)

`@stash-it/postgresql-adapter` is a simple PostgreSQL adapter that can be used with `@stash-it/stash-it`.
It uses `pg` package under the hood.

## Installation

npm

```bash
npm install @stash-it/postgresql-adapter
```

deno

```bash
deno add @stash-it/postgresql-adapter
```

yarn

```bash
yarn dlx jsr add @stash-it/postgresql-adapter
```

pnpm

```bash
pnpm dlx jsr add @stash-it/postgresql-adapter
```

bun

```bash
bunx jsr add @stash-it/postgresql-adapter
```

You can also use the `jsr:` specifier directly in Deno:

```ts
import { PostgreSqlAdapter } from "jsr:@stash-it/postgresql-adapter";
```

## Usage

```ts
// Import stash-it main class.
import { StashIt } from "@stash-it/stash-it";
import { PostgreSqlAdapter } from "@stash-it/postgresql-adapter";

// Create an instance of the adapter. Use whatever configuration your PostgreSQL instance runs on.
const adapter = new PostgreSqlAdapter({
  connection: {
    host: "localhost",
    user: "user",
    password: "password",
    database: "dbname",
    port: 5432, // optional property, if not set, this value is used
  },
  // The whole "table" configuration is optional
  // So are the properties of this object.
  // If not provided, those values are used and expected.
  table: {
    tableName: "items",
    keyColumnName: "key",
    valueColumnName: "value",
    extraColumnName: "extra",
  },
});

// And use it with stash-it.
const stash = new StashIt(adapter);
```

## Table schema

If you don't have a table ready, you can use this query to create one. This is the expected schema.

```sql
CREATE TABLE "items" (
  "key" TEXT PRIMARY KEY,
  "value" JSONB NOT NULL,
  "extra" JSONB NOT NULL
)
```

## Development/testing

### Running tests locally

Copy the example environment file and adjust if needed:

```bash
cp .env.example .env
```

The `.env.example` file contains the default values. Use different if need be.

Then execute `pnpm test`.

The tests you will run do all sorts of checks to verify if the adapter is capable of conducting CRUD operations.

If you want, you can target different DBs in different environments and run the tests against them.
The test suite will clean up after self (or at least attempt), as it is designed to add numerous data,
check if it is readable, and eventually it's removed.

## License

MIT

## Contribution

Feel free to open an issue or a pull request.
