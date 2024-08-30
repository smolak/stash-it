# `@stash-it/ttl-plugin`

![logo-stash-it-color-dark 2x](https://user-images.githubusercontent.com/1819138/30385483-99fd209c-98a7-11e7-85e2-595791d8d894.png)

`@stash-it/ttl-plugin` is a plugin for `@stash-it/stash-it` that allows you to add a TTL.
Time to live (TTL) refers to the amount of time or “hops” that an item is set to exist inside a storage before being discarded by stash-it.

### When to use it?

If you need to set a time limit for how long an item should be stored in the storage, this plugin is for you.
For instance, some data is only relevant for a certain amount of time, and after that time, it should be removed from the storage.

## Installation

npm
```bash
npm install @stash-it/ttl-plugin
```

deno
```bash
deno add @stash-it/ttl-plugin
```

yarn
```bash
yarn dlx jsr add @stash-it/ttl-plugin
```

pnpm
```bash
pnpm dlx jsr add @stash-it/ttl-plugin
```

bun
```bash
bunx jsr add @stash-it/ttl-plugin
```

## Usage

```ts
// Import stash-it main class.
import { StashIt } from '@stash-it/stash-it';

// Import the plugin.
import { createTtlPlugin } from '@stash-it/ttl-plugin';

// For it to work you will also need an adapter.
// You can use any of the @stash-it adapters or create your own.
import { MemoryAdapter } from '@stash-it/memory-adapter';

// Create an instance of the adapter.
const adapter = new MemoryAdapter();

// Create an instance of stash-it.
const stash = new StashIt(adapter);

// Create an instance of the plugin.
const plugin = createPrefixSuffixPlugin({
  ttl: 3_600, // 1 hour
});

// Register plugin
stash.registerPlugins([plugin]);

// Use it.
await stash.set('key', 'value');
const item = await stash.get('key');
const exists = await stash.has('key');

console.log(exists); // true
console.log(item?.value); // 'value'
console.log(item?.extra); // { ttl: 3_600, createdAt: '2024-08-26T20:26:41.832Z' }

// Wait for 1 hour (and a bit more)
const item2 = await stash.get('key');

console.log(item2); // undefined
```
