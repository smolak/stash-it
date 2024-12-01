# `@stash-it/sqlite-adapter`

![logo-stash-it-color-dark 2x](https://user-images.githubusercontent.com/1819138/30385483-99fd209c-98a7-11e7-85e2-595791d8d894.png)

`@stash-it/sqlite-adapter` is a Sqlite3 adapter that can be used with `@stash-it/stash-it`.

## Installation

npm

```bash
npm install @stash-it/sqlite-adapter
```

deno

```bash
deno add @stash-it/sqlite-adapter
```

yarn

```bash
yarn dlx jsr add @stash-it/sqlite-adapter
```

pnpm

```bash
pnpm dlx jsr add @stash-it/sqlite-adapter
```

bun

```bash
bunx jsr add @stash-it/sqlite-adapter
```

## Usage

```ts
// Import stash-it main class.
import { StashIt } from "@stash-it/stash-it";
import { SqliteAdapter, type SqliteAdapterConfiguration } from "@stash-it/sqlite-adapter";

// Create an instance of the adapter.
const adapter = new SqliteAdapter({
  connection: {
    dbPath: "path/to/your/db.sqlite",
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
  "value" TEXT,
  "extra" TEXT
)
```

## License

MIT

## Contribution

Feel free to open an issue or a pull request.
