# `@stash-it/tags-plugin`

![logo-stash-it-color-dark 2x](https://user-images.githubusercontent.com/1819138/30385483-99fd209c-98a7-11e7-85e2-595791d8d894.png)

`@stash-it/tags-plugin` is a plugin for `@stash-it/stash-it` that allows you to add tags to stored items.
Tags are stored in the item's metadata and the plugin maintains a reverse index for efficient tag-based lookups.

### When to use it?

If you need to categorize and organize your stored items with tags, and later find or remove items by those tags, this plugin is for you.
For instance, you might want to tag items as "movie", "marvel", "action" and then find all items with the "marvel" tag.

## Installation

npm

```bash
npm install @stash-it/tags-plugin
```

deno

```bash
deno add @stash-it/tags-plugin
```

yarn

```bash
yarn dlx jsr add @stash-it/tags-plugin
```

pnpm

```bash
pnpm dlx jsr add @stash-it/tags-plugin
```

bun

```bash
bunx jsr add @stash-it/tags-plugin
```

You can also use the `jsr:` specifier directly in Deno:

```ts
import { createTagsPlugin, getKeysByTags, removeByTags } from "jsr:@stash-it/tags-plugin";
```

## Usage

### Basic Usage

```ts
// Import stash-it main class.
import { StashIt } from "@stash-it/stash-it";

// Import the plugin and helper functions.
import { createTagsPlugin, getKeysByTags, removeByTags, getItemTags } from "@stash-it/tags-plugin";

// For it to work you will also need an adapter.
// You can use any of the @stash-it adapters or create your own.
import { MemoryAdapter } from "@stash-it/memory-adapter";

// Create an instance of the adapter.
const adapter = new MemoryAdapter();

// Create an instance of stash-it with the tags plugin.
// Using .use() provides full type safety for the __tags property!
const stash = new StashIt(adapter).use(createTagsPlugin());

// Store items with tags - __tags is now typed and autocompleted!
await stash.setItem("movie1", { title: "Avengers" }, { __tags: ["movie", "marvel", "action"] });
await stash.setItem("movie2", { title: "Iron Man" }, { __tags: ["movie", "marvel"] });
await stash.setItem("movie3", { title: "The Hangover" }, { __tags: ["movie", "comedy"] });

// Get item and extract tags using the helper
const item = await stash.getItem("movie1");
const tags = getItemTags(item); // ['movie', 'marvel', 'action']
```

### Chaining Multiple Plugins

```ts
import { createTagsPlugin, TagsExtra } from "@stash-it/tags-plugin";
import { createTtlPlugin, TtlExtra } from "@stash-it/ttl-plugin";

// Chain plugins - types accumulate automatically!
const stash = new StashIt(adapter)
  .use(createTagsPlugin())
  .use(createTtlPlugin({ ttl: 3600 }));

// Both __tags and __ttl are now typed!
await stash.setItem("key", value, {
  __tags: ["movie", "action"],  // ✅ typed from TagsPlugin
  // __ttl is auto-added by TTL plugin
});
```

### Finding Items by Tags

```ts
// Find items with ANY of the specified tags (default mode)
const marvelOrComedy = await getKeysByTags(stash, ["marvel", "comedy"]);
console.log(marvelOrComedy); // ['movie1', 'movie2', 'movie3']

// Find items with ALL of the specified tags
const marvelAction = await getKeysByTags(stash, ["marvel", "action"], "all");
console.log(marvelAction); // ['movie1']
```

### Removing Items by Tags

```ts
// Remove items with ANY of the specified tags (default mode)
const result = await removeByTags(stash, ["action"]);
console.log(result.removedKeys); // ['movie1']

// Remove items with ALL of the specified tags
const result2 = await removeByTags(stash, ["movie", "comedy"], "all");
console.log(result2.removedKeys); // ['movie3']
```

### Updating Tags

When you update an item with new tags, the plugin automatically updates the tag indexes:

```ts
// Initial tags
await stash.setItem("movie1", { title: "Avengers" }, { __tags: ["movie", "action"] });

// Update with different tags - old tags are removed from indexes
await stash.setItem("movie1", { title: "Avengers" }, { __tags: ["movie", "comedy"] });

// Now movie1 is only found with 'movie' and 'comedy' tags, not 'action'
const actionMovies = await getKeysByTags(stash, ["action"]);
console.log(actionMovies); // []
```

## Tag Format

Tags must be non-empty strings containing only:
- Alphanumeric characters (a-z, A-Z, 0-9)
- Underscores (_)
- Hyphens (-)

Invalid tags will throw an error:

```ts
// This will throw an error
await stash.setItem("key", "value", { __tags: ["invalid tag with spaces"] });
```

## API Reference

### `createTagsPlugin()`

Creates a tags plugin instance.

```ts
const plugin = createTagsPlugin();
stash.use(plugin);
```

### `withTags(tags, extra?)`

Type-safe helper to create an extra object with tags. Avoids typos in the property name.

- `tags` - Array of tags to add
- `extra` - Optional additional extra properties to merge

Returns an extra object with the `__tags` property.

```ts
// Just tags
await stash.setItem('key', value, withTags(['movie', 'marvel']));

// Tags with other extra properties
await stash.setItem('key', value, withTags(['movie'], { rating: 5, year: 2024 }));
```

### `getItemTags(item)`

Extracts tags from an item's extra data. Returns an empty array if no tags are present.

- `item` - The item to extract tags from, or undefined

```ts
const item = await stash.getItem('key');
const tags = getItemTags(item); // ['movie', 'marvel']
```

### `TagsExtra` (type)

TypeScript interface for the extra object containing tags. Use this for type annotations.

```ts
import type { TagsExtra } from '@stash-it/tags-plugin';

const extra: TagsExtra = { __tags: ['movie', 'marvel'] };
```

### `getKeysByTags(stash, tags, mode?)`

Finds keys of items that have the specified tags.

- `stash` - The StashIt instance
- `tags` - Array of tags to search for
- `mode` - Optional. `"any"` (default) or `"all"`
  - `"any"` - Returns items with at least one matching tag
  - `"all"` - Returns only items that have all specified tags

Returns a `Promise<string[]>` of matching keys.

### `removeByTags(stash, tags, mode?)`

Removes items that have the specified tags.

- `stash` - The StashIt instance
- `tags` - Array of tags to match for removal
- `mode` - Optional. `"any"` (default) or `"all"`

Returns a `Promise<RemoveByTagsResult>`:

```ts
interface RemoveByTagsResult {
  removedKeys: string[];   // Keys that were successfully removed
  notFoundKeys: string[];  // Keys in index but item was not found
}
```

### Constants

- `TAGS_EXTRA_PROPERTY_NAME` - The property name used in extra for tags (`"__tags"`)
- `TAGS_INDEX_KEY_PREFIX` - The prefix used for tag index keys (`"__tags_index_"`)

## Notes

- Tags are stored in the item's `extra` property under `__tags`
- The plugin maintains reverse indexes (tag → keys) stored as items with keys prefixed by `__tags_index_`
- Concurrent operations on the same tag may have race conditions. For highly concurrent environments, consider implementing proper locking mechanisms.
