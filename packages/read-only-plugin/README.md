# `@stash-it/read-only-plugin`

![logo-stash-it-color-dark 2x](https://user-images.githubusercontent.com/1819138/30385483-99fd209c-98a7-11e7-85e2-595791d8d894.png)

`@stash-it/read-only-plugin` is a plugin for `@stash-it/stash-it` that allows you disabl chaning items, or adding new ones.

### When to use it?

Let's say you have a role, for logged in users (or not logged in), that gives them limited access to things.
And that would also mean not doing any changes in the storage related to the items stored there.

## Installation

npm

```bash
npm install @stash-it/read-only-plugin
```

deno

```bash
deno add @stash-it/read-only-plugin
```

yarn

```bash
yarn dlx jsr add @stash-it/read-only-plugin
```

pnpm

```bash
pnpm dlx jsr add @stash-it/read-only-plugin
```

bun

```bash
bunx jsr add @stash-it/read-only-plugin
```

You can also use the `jsr:` specifier directly in Deno:

```ts
import { createReadOnlyPlugin } from "jsr:@stash-it/read-only-plugin";
```

## Usage

```ts
// Import stash-it main class.
import { StashIt } from "@stash-it/stash-it";

// Import the plugin.
import { createReadOnlyPlugin } from "@stash-it/read-only-plugin";
import { MemoryAdapter } from "@stash-it/memory-adapter";

// Create an instance of the adapter.
const adapter = new MemoryAdapter();

// Create an instance of stash-it.
const stash = new StashIt(adapter);

// Create an instance of the plugin.
const plugin = createReadOnlyPlugin();

// Register the plugin to the stash-it instance.
stash.registerPlugins([plugin]);

// Use it.
await stash.get("key"); // Returns an item if it exists

await stash.set("key", "value"); // Throws an error
```

You can also configure your own error messages:

```ts
createReadOnlyPlugin({
  setItemErrorMessage: "Custom setItem error message.",
});
```
