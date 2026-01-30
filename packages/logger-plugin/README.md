# `@stash-it/logger-plugin`

![logo-stash-it-color-dark 2x](https://user-images.githubusercontent.com/1819138/30385483-99fd209c-98a7-11e7-85e2-595791d8d894.png)

`@stash-it/logger-plugin` is a plugin for `@stash-it/stash-it` that allows you to log data that is passed to all hook methods.

### When to use it?

When you want to track the flow of the data, before and after it goes to the adapter.

## Installation

npm

```bash
npm install @stash-it/logger-plugin
```

deno

```bash
deno add @stash-it/logger-plugin
```

yarn

```bash
yarn dlx jsr add @stash-it/logger-plugin
```

pnpm

```bash
pnpm dlx jsr add @stash-it/logger-plugin
```

bun

```bash
bunx jsr add @stash-it/logger-plugin
```

You can also use the `jsr:` specifier directly in Deno:

```ts
import { createLoggerPlugin } from "jsr:@stash-it/logger-plugin";
```

## Usage

```ts
// Import stash-it main class.
import { StashIt } from "@stash-it/stash-it";

// Import the plugin.
import { createLoggerPlugin } from "@stash-it/logger-plugin";

// For it to work you will also need an adapter.
// You can use any of the @stash-it adapters or create your own.
import { MemoryAdapter } from "@stash-it/memory-adapter";

// Create an instance of the adapter.
const adapter = new MemoryAdapter();

// Create an instance of stash-it.
const stash = new StashIt(adapter);

// Create an instance of the plugin and pass whatever function you will log with.
const plugin = createLoggerPlugin(console.log);

// Register the plugin to the stash-it instance.
stash.registerPlugins([plugin]);

// Use it.
await stash.set("key", "value");
```

Log function gets called twice, with:

1. `"beforeSetItem", { adapter: "MemoryAdapter", key: "key", value: "value", extra: {} }`
2. `"afterSetItem", { adapter: "MemoryAdapter", key: "key", value: "value", extra: {}, item: { key: "key", value: "value", extra: {} } }`

That's because:

1. First log is called before data is used by the adapter (so you know what will be sent to it), meaning when the "beforeSetItem" hook handler gets executed.
2. Second is what is passed to the "afterSetItem" hook handler.

The `adapter: "MemoryAdapter"` is basically the name of the adapter's class. If you'll be using a different one, its class' name will be logged.
