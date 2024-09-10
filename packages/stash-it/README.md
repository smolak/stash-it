# `@stash-it/stash-it`

![logo-stash-it-color-dark 2x](https://user-images.githubusercontent.com/1819138/30385483-99fd209c-98a7-11e7-85e2-595791d8d894.png)

`@stash-it` is a simple, yet powerful, key-value storage library. It is designed to be easy to use and to have a clear API. It is also extensible, so you can create your own adapters and use them with `@stash-it`. The storage of your choice is not supported (yet)? No problem, you can create an adapter for it and use it with `@stash-it`.

`@stash-it` is designed to be used in any environment, provided that the storage is directly available in that environment. For example, you can use `MemoryAdapter` anywhere, but `RedisAdapter` can be used only in a Node.js (or Bun, or Deno).
It is designed to be configured to be used with any storage.

Due to the usage of adapters, that follow the same interface, you can (if technically possible) switch between them at any time.

On top of that, you can hook into the lifecycle of actions performed, so you can do some additional work when an item is set, get, removed, etc.

Let's look at some examples:

### Basic usage

```typescript
// Import main class.
import { StashIt } from '@stash-it/stash-it';

// For it to work you will also need an adapter.
// You can use any of the @stash-it adapters or create your own.
import { MemoryAdapter } from '@stash-it/memory-adapter';

// Create an instance of the adapter.
const adapter = new MemoryAdapter();

// Create an instance of stash-it.
const stash = new StashIt(adapter);

// Use it.
await stash.set('key', 'value');
const item = await stash.get('key');

console.log(item.value); // 'value'
```

### Hook'able methods

As mentioned, you can hook into the lifecycle of actions performed.

Let's say, you want to log every time an item is set. Logging is not a built-in feature of `@stash-it`, but you can easily achieve it by hooking into the `setItem` method.
Here's how you can do it:

```typescript
import { StashIt, type StashItAdapterInterface, type StashItPlugin } from '@stash-it/stash-it';
// Heads up! Types/interfaces come from core package: 
import type { StashItAdapterInterface, StashItPlugin, Item } from "@stash-it/core";
import { MemoryAdapter } from '@stash-it/memory-adapter';

const stash = new StashIt(new MemoryAdapter());

const loggerPlugin: StashItPlugin = {
  hookHandlers: {
    beforeSetItem: async (args) => {
      // Log whatever you want, using the logger of your choice.
      console.log(`Item with key "${args.key}" was set.`);
      
      // Return the arguments, to continue with the flow of data.
      return args;
    }
  }
};

stash.registerPlugins([loggerPlugin]);

await stash.setItem('the key', 'some value', { optional: 'extra data' });
// console.log: Item with key "the key" was set.

await stash.getItem('the key');
// no logging, as no logger was set for getItem lifecycle method
```

How does it work?

Each method has `before` and `after` hooks. You can hook into any of them.
The `before` hooks are called before the actual method is called, and the `after` hooks are called after the method is called.

You can also stop the flow of data by not returning the arguments, or by returning something else, provided you're honoring the types.

The flow looks like this:

```sh
methodCall(args) --> beforeHook(args) --> adapterMethodCall(args) --> afterHook(args) --> data returned
```

So for the `setItem` method, the flow would look like this:

```sh
setItem(args) --> beforeSetItem(args) --> adapter.setItem(args) --> afterSetItem(args) --> setItem return data
```

There is one method, `buildKey`, that has a single hook called `buildKey`. It is called before the key is built. As this method is not persisting any data, but prepares the key to be used to store the data, the flow does not require the after hook.

A perfect example for using this hook is the `@stash-it/prefix-suffix-plugin` plugin. It allows you to add a prefix and/or a suffix to the key before it is used to store the data.

The implementation is more or less this:

```typescript
const createPrefixSuffixPlugin = ({ prefix, suffix }): StashItPlugin => ({
  hookHandlers: {
    buildKey: async (key: Key) => ({ key: `${prefix}${key}${suffix}` })
  }
});
```

More examples and documentation coming soon.

## Installation

npm
```bash
npx jsr add @stash-it/stash-it
```

deno
```bash
deno add @stash-it/stash-it
```

yarn
```bash
yarn dlx jsr add @stash-it/stash-it
```

pnpm
```bash
pnpm dlx jsr add @stash-it/stash-it
```

bun
```bash
bunx jsr add @stash-it/stash-it
```

## License

MIT

## Contribution

Feel free to open an issue or a pull request.
