import type { Extra, Item, Key, StashItAdapter, StashItInterface, StashItPlugin } from "@stash-it/core";
import { z } from "zod";

/** Match mode for tag-based operations. */
export type TagMatchMode = "any" | "all";

/** Result of a removeByTags operation. */
export interface RemoveByTagsResult {
  /** Keys that were successfully removed. */
  removedKeys: string[];
  /** Keys that were found in the index but the item no longer existed. */
  notFoundKeys: string[];
}

/**
 * Name of the property in extra that will hold the tags data.
 */
export const TAGS_EXTRA_PROPERTY_NAME = "__tags" as const;

/**
 * Type for the extra object containing tags.
 * Use this to get type-safe access to the __tags property.
 *
 * @example
 * ```typescript
 * const stash = new StashIt(adapter).use(createTagsPlugin());
 * // Now __tags is typed!
 * await stash.setItem('key', value, { __tags: ['movie', 'marvel'] });
 * ```
 */
export interface TagsExtra extends Extra {
  [TAGS_EXTRA_PROPERTY_NAME]: string[];
}

/**
 * Creates an extra object with tags.
 * This helper provides type safety and avoids typos in the property name.
 *
 * @param tags - Array of tags to add
 * @param extra - Optional additional extra properties to merge
 * @returns Extra object with tags
 *
 * @example
 * ```typescript
 * // Just tags
 * await stash.setItem('key', value, withTags(['movie', 'marvel']));
 *
 * // Tags with other extra properties
 * await stash.setItem('key', value, withTags(['movie'], { rating: 5 }));
 * ```
 */
export const withTags = <T extends Extra = Extra>(tags: string[], extra?: T): TagsExtra & T => {
  return {
    ...extra,
    [TAGS_EXTRA_PROPERTY_NAME]: tags,
  } as TagsExtra & T;
};

/**
 * Extracts tags from an item's extra data.
 * Returns an empty array if no tags are present.
 *
 * @param item - The item to extract tags from, or undefined
 * @returns Array of tags, or empty array if none
 *
 * @example
 * ```typescript
 * const item = await stash.getItem('key');
 * const tags = getItemTags(item); // ['movie', 'marvel']
 * ```
 */
export const getItemTags = (item: Item | undefined): string[] => {
  if (!item) {
    return [];
  }

  const tags = item.extra[TAGS_EXTRA_PROPERTY_NAME];

  if (!tags || !Array.isArray(tags)) {
    return [];
  }

  return tags as string[];
};

/**
 * Prefix for the index keys that store tag-to-keys mappings.
 */
export const TAGS_INDEX_KEY_PREFIX = "__tags_index_" as const;

/**
 * Schema for validating a single tag.
 * Tags must be non-empty strings containing only alphanumeric characters, underscores, and hyphens.
 */
const tagSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9_-]+$/, {
    message: "Tags must contain only alphanumeric characters, underscores, and hyphens.",
  });

/**
 * Schema for validating an array of tags.
 */
const tagsArraySchema = z.array(tagSchema);

/**
 * Get the index key for a given tag.
 */
const getIndexKey = (tag: string): Key => `${TAGS_INDEX_KEY_PREFIX}${tag}`;

/**
 * Get keys from a tag index.
 */
const getKeysFromIndex = async (adapter: StashItAdapter, tag: string): Promise<string[]> => {
  const indexKey = getIndexKey(tag);
  const indexItem = await adapter.getItem(indexKey);

  if (!indexItem) {
    return [];
  }

  return indexItem.value as string[];
};

/**
 * Add a key to a tag index.
 */
const addKeyToIndex = async (adapter: StashItAdapter, tag: string, key: Key): Promise<void> => {
  const indexKey = getIndexKey(tag);
  const existingKeys = await getKeysFromIndex(adapter, tag);

  if (!existingKeys.includes(key)) {
    await adapter.setItem(indexKey, [...existingKeys, key]);
  }
};

/**
 * Remove a key from a tag index.
 */
const removeKeyFromIndex = async (adapter: StashItAdapter, tag: string, key: Key): Promise<void> => {
  const indexKey = getIndexKey(tag);
  const existingKeys = await getKeysFromIndex(adapter, tag);
  const filteredKeys = existingKeys.filter((k) => k !== key);

  if (filteredKeys.length === 0) {
    await adapter.removeItem(indexKey);
  } else if (filteredKeys.length !== existingKeys.length) {
    await adapter.setItem(indexKey, filteredKeys);
  }
};

/**
 * Get tags from an item's extra data.
 */
const getTagsFromExtra = (extra: Extra): string[] => {
  const tags = extra[TAGS_EXTRA_PROPERTY_NAME];

  if (!tags) {
    return [];
  }

  return tags as string[];
};

// Store for item tags during setItem (used between beforeSetItem and afterSetItem)
const pendingSetItemOldTags = new Map<Key, string[]>();

// Store for item tags that will be removed (used between beforeRemoveItem and afterRemoveItem)
const pendingRemovals = new Map<Key, string[]>();

/**
 * Create a plugin that adds tagging functionality to items.
 *
 * Tags are stored in the item's extra data under the `__tags` property.
 * The plugin also maintains a reverse index for efficient tag-based lookups.
 *
 * @example
 * ```typescript
 * import { StashIt } from '@stash-it/stash-it';
 * import { MemoryAdapter } from '@stash-it/memory-adapter';
 * import { createTagsPlugin, getKeysByTags, removeByTags } from '@stash-it/tags-plugin';
 *
 * const adapter = new MemoryAdapter();
 * const stash = new StashIt(adapter)
 *   .use(createTagsPlugin()); // Type-safe: stash now knows about __tags
 *
 * // Store items with tags - __tags is now typed!
 * await stash.setItem('movie1', { title: 'Avengers' }, { __tags: ['movie', 'marvel', 'action'] });
 * await stash.setItem('movie2', { title: 'Iron Man' }, { __tags: ['movie', 'marvel'] });
 *
 * // Find items by tags
 * const marvelMovies = await getKeysByTags(stash, ['marvel']); // ['movie1', 'movie2']
 *
 * // Remove items by tags
 * await removeByTags(stash, ['action']); // Removes 'movie1'
 * ```
 */
export const createTagsPlugin = (): StashItPlugin<TagsExtra> => {
  return {
    hookHandlers: {
      beforeSetItem: async ({ adapter, key, value, extra }) => {
        const tags = extra[TAGS_EXTRA_PROPERTY_NAME];

        // If no tags provided, pass through unchanged
        if (tags === undefined) {
          return { key, value, extra };
        }

        // Validate tags format
        const parseResult = tagsArraySchema.safeParse(tags);

        if (!parseResult.success) {
          const issues = parseResult.error.issues;
          throw new Error(`Invalid tags format: ${issues.map((e) => e.message).join(", ")}`);
        }

        // Get existing item to check for previous tags (before the item is updated)
        const existingItem = await adapter.getItem(key);
        const oldTags = existingItem ? getTagsFromExtra(existingItem.extra) : [];
        pendingSetItemOldTags.set(key, oldTags);

        return { key, value, extra };
      },

      afterSetItem: async ({ adapter, key, value, extra, item }) => {
        const newTags = getTagsFromExtra(extra);
        const oldTags = pendingSetItemOldTags.get(key) || [];
        pendingSetItemOldTags.delete(key);

        // Remove key from indexes of tags that are no longer present
        const removedTags = oldTags.filter((tag) => !newTags.includes(tag));
        for (const tag of removedTags) {
          await removeKeyFromIndex(adapter, tag, key);
        }

        // Add key to indexes of new tags
        for (const tag of newTags) {
          await addKeyToIndex(adapter, tag, key);
        }

        return { key, value, extra, item };
      },

      beforeRemoveItem: async ({ adapter, key }) => {
        // Get the item's tags before it's removed
        const item = await adapter.getItem(key);

        if (item) {
          const tags = getTagsFromExtra(item.extra);
          if (tags.length > 0) {
            pendingRemovals.set(key, tags);
          }
        }

        return { key };
      },

      afterRemoveItem: async ({ adapter, key, result }) => {
        // If removal was successful and we have pending tags to clean up
        if (result) {
          const tags = pendingRemovals.get(key);

          if (tags) {
            for (const tag of tags) {
              await removeKeyFromIndex(adapter, tag, key);
            }
            pendingRemovals.delete(key);
          }
        }

        return { key, result };
      },
    },
  };
};

/**
 * Get keys of items that have the specified tags.
 *
 * @param stash - The StashIt instance to search in.
 * @param tags - Array of tags to search for.
 * @param mode - Match mode: "any" (default) returns items with at least one matching tag,
 *               "all" returns only items that have all specified tags.
 * @returns Array of keys that match the tag criteria.
 *
 * @example
 * ```typescript
 * // Find items with any of the specified tags
 * const keys = await getKeysByTags(stash, ['movie', 'music']); // items with 'movie' OR 'music'
 *
 * // Find items with all of the specified tags
 * const keys = await getKeysByTags(stash, ['movie', 'action'], 'all'); // items with 'movie' AND 'action'
 * ```
 */
export const getKeysByTags = async (
  stash: StashItInterface,
  tags: string[],
  mode: TagMatchMode = "any",
): Promise<string[]> => {
  if (tags.length === 0) {
    return [];
  }

  // Validate tags
  const parseResult = tagsArraySchema.safeParse(tags);
  if (!parseResult.success) {
    const issues = parseResult.error.issues;
    throw new Error(`Invalid tags format: ${issues.map((e) => e.message).join(", ")}`);
  }

  // Get keys for each tag from the index
  const keysByTag: string[][] = [];

  for (const tag of tags) {
    const indexKey = getIndexKey(tag);
    const indexItem = await stash.getItem(indexKey);
    const keys = indexItem ? (indexItem.value as string[]) : [];
    keysByTag.push(keys);
  }

  if (mode === "any") {
    // Union: return all unique keys that appear in any tag index
    const allKeys = new Set<string>();
    for (const keys of keysByTag) {
      for (const key of keys) {
        allKeys.add(key);
      }
    }
    return Array.from(allKeys);
  }

  // mode === "all"
  // Intersection: return keys that appear in ALL tag indexes
  if (keysByTag.length === 0 || keysByTag.some((keys) => keys.length === 0)) {
    return [];
  }

  // At this point we know keysByTag has at least one element (checked above)
  const firstKeys = keysByTag[0] as string[];
  const restKeys = keysByTag.slice(1);
  return firstKeys.filter((key) => restKeys.every((keys) => keys.includes(key)));
};

/**
 * Remove items that have the specified tags.
 *
 * @param stash - The StashIt instance to remove items from.
 * @param tags - Array of tags to match for removal.
 * @param mode - Match mode: "any" (default) removes items with at least one matching tag,
 *               "all" removes only items that have all specified tags.
 * @returns Object containing arrays of removed keys and keys that were in the index but item was not found.
 *
 * @example
 * ```typescript
 * // Remove items with any of the specified tags
 * const result = await removeByTags(stash, ['temporary', 'draft']);
 * console.log(result.removedKeys); // ['item1', 'item2']
 *
 * // Remove items with all of the specified tags
 * const result = await removeByTags(stash, ['old', 'archived'], 'all');
 * ```
 */
export const removeByTags = async (
  stash: StashItInterface,
  tags: string[],
  mode: TagMatchMode = "any",
): Promise<RemoveByTagsResult> => {
  const keysToRemove = await getKeysByTags(stash, tags, mode);

  const removedKeys: string[] = [];
  const notFoundKeys: string[] = [];

  for (const key of keysToRemove) {
    const removed = await stash.removeItem(key);
    if (removed) {
      removedKeys.push(key);
    } else {
      notFoundKeys.push(key);
    }
  }

  return { removedKeys, notFoundKeys };
};
