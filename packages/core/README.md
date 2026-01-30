# `@stash-it/core`

![logo-stash-it-color-dark 2x](https://user-images.githubusercontent.com/1819138/30385483-99fd209c-98a7-11e7-85e2-595791d8d894.png)

Set of interfaces and types for `@stash-it`, for main class, adapters and plugins (and some other things).

The main ones you'll be interested in are:

- `StashItAdapter` - base class used to create your own adapters
- `StashItPlugin` type to create your own plugins

See [usage](#usage) for examples.

## Installation

npm

```bash
npx jsr add @stash-it/core
```

deno

```bash
deno add @stash-it/core
```

yarn

```bash
yarn dlx jsr add @stash-it/core
```

pnpm

```bash
pnpm dlx jsr add @stash-it/core
```

bun

```bash
bunx jsr add @stash-it/core
```

You can also use the `jsr:` specifier directly in Deno:

```ts
import { StashItAdapter, type StashItPlugin } from "jsr:@stash-it/core";
```

## Usage

### `StashItAdapter`

```typescript
import { StashItAdapter } from "@stash-it/core";

// Your adapter class should extend from the base abstract class.
class MyAdapter extends StashItAdapter {
  // Your implementation here.
}
```

The base class contains two methods, that you should implement if your adapter requires establishing a connection and/or disconnecting from a storage.

For instance:

```typescript
import { StashItAdapter } from "@stash-it/core";

// Your adapter class should extend from the base abstract class.
class MyAdapter extends StashItAdapter {
  override async connect(): Promise<void> {
    // Depending on the storage, it can look different.
    // For example:
    this.#database.connect();
  }

  override async disconnect(): Promise<void> {
    this.#database.connect();
  }
}
```

### `StashItPlugin`

```typescript
import { type StashItPlugin } from "@stash-it/core";

// Your plugin can be a function that returns StashItPlugin:
const myPlugin = (someArgsIfNeedBe): StashItPlugin => {
  // Your implementation here.
};

// It can also be an object, depends on what your plugin needs:
const myPlugin2: StashItPlugin = {
  // Your implementation here.
};
```

## License

MIT

## Contribution

Feel free to open an issue or a pull request.
