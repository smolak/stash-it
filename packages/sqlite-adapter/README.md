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
import { StashIt } from '@stash-it/stash-it';
import { SqliteAdapter } from '@stash-it/sqlite-adapter';

// Create an instance of the adapter.
const adapter = new SqliteAdapter({ dbPath: 'path/to/your/db.sqlite' });

// And use it with stash-it.
const stash = new StashIt(adapter);
```

### Configuration

```ts
const adapterOptions: SqliteAdapterOptions = {
    dbPath: 'path/to/your/db.sqlite', // <-- this is the only required configuration
    // rest of them are optional; the default values, if not passed, are the values below:
    tableName: 'items',
    keyColumnName: 'key',
    valueColumnName: 'value',
    extraColumnName: 'extra'
};
```

## License

MIT

## Contribution

Feel free to open an issue or a pull request.
