# `@stash-it/memory-adapter`

## Description

`MemoryAdapter` is a simple in-memory adapter that can be used with `@stash-it/stash-it`.

## Usage

```ts
// Import stash-it main class.
import { StashIt } from '@stash-it/stash-it';
import { MemoryAdapter } from '@stash-it/memory-adapter';

// Create an instance of the adapter.
const adapter = new MemoryAdapter();

// And use it with stash-it.
const stash = new StashIt(adapter);

```