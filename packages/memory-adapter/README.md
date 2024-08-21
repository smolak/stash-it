# `@stash-it/memory-adapter`

![logo-stash-it-color-dark 2x](https://user-images.githubusercontent.com/1819138/30385483-99fd209c-98a7-11e7-85e2-595791d8d894.png)

### Description

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