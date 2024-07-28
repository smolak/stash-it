# `@stash-it/prefix-suffix-plugin`

## Description

`PrefixSuffixPlugin` is a plugin for `@stash-it/stash-it` that allows you to add a prefix and/or suffix to the key before persisting the value.

## When to use it?

Let's say you're using a storage that doesn't support namespaces, but you want to separate the keys for different parts of your application. You can use this plugin to add a prefix and/or suffix to the key.

## Usage

```ts
// Import stash-it main class.
import { StashIt } from '@stash-it/stash-it';

// Import the plugin.
import { createPrefixSuffixPlugin } from '@stash-it/prefix-suffix-plugin';

// For it to work you will also need an adapter.
// You can use any of the @stash-it adapters or create your own.
import { MemoryAdapter } from '@stash-it/memory-adapter';

// Create an instance of the adapter.
const adapter = new MemoryAdapter();

// Create an instance of stash-it.
const stash = new StashIt(adapter);

// Create an instance of the plugin.
const plugin = createPrefixSuffixPlugin({
  prefix: 'prefix-',
  suffix: '-suffix',
});

// Register the plugin to the stash-it instance.
stash.registerPlugins([plugin]);

// Use it.
await stash.set('key', 'value');
const item = await stash.get('key');

console.log(item.key); // 'prefix-key-suffix'
```