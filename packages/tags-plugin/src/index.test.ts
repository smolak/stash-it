import { getHandler } from "@stash-it/dev-tools";
import { MemoryAdapter } from "@stash-it/memory-adapter";
import { StashIt } from "@stash-it/stash-it";
import { beforeEach, describe, expect, it } from "vitest";

import {
  createTagsPlugin,
  getItemTags,
  getKeysByTags,
  removeByTags,
  TAGS_EXTRA_PROPERTY_NAME,
  TAGS_INDEX_KEY_PREFIX,
  type TagsExtra,
  withTags,
} from "./index";

describe("tags-plugin", () => {
  describe("createTagsPlugin", () => {
    describe("beforeSetItem hook", () => {
      it("passes through when no tags provided", async () => {
        const adapter = new MemoryAdapter();
        const plugin = createTagsPlugin();
        const handler = getHandler("beforeSetItem", plugin);

        const result = await handler({
          adapter,
          key: "key",
          value: "value",
          extra: { foo: "bar" },
        });

        expect(result).toEqual({
          key: "key",
          value: "value",
          extra: { foo: "bar" },
        });
      });

      it("passes through when tags are valid", async () => {
        const adapter = new MemoryAdapter();
        const plugin = createTagsPlugin();
        const handler = getHandler("beforeSetItem", plugin);

        const result = await handler({
          adapter,
          key: "key",
          value: "value",
          extra: { [TAGS_EXTRA_PROPERTY_NAME]: ["tag1", "tag2"] },
        });

        expect(result).toEqual({
          key: "key",
          value: "value",
          extra: { [TAGS_EXTRA_PROPERTY_NAME]: ["tag1", "tag2"] },
        });
      });

      it("throws when tags is not an array", async () => {
        const adapter = new MemoryAdapter();
        const plugin = createTagsPlugin();
        const handler = getHandler("beforeSetItem", plugin);

        await expect(
          handler({
            adapter,
            key: "key",
            value: "value",
            extra: { [TAGS_EXTRA_PROPERTY_NAME]: "not-an-array" },
          }),
        ).rejects.toThrow("Invalid tags format");
      });

      it("throws when tags contains empty string", async () => {
        const adapter = new MemoryAdapter();
        const plugin = createTagsPlugin();
        const handler = getHandler("beforeSetItem", plugin);

        await expect(
          handler({
            adapter,
            key: "key",
            value: "value",
            extra: { [TAGS_EXTRA_PROPERTY_NAME]: ["valid", ""] },
          }),
        ).rejects.toThrow("Invalid tags format");
      });

      it("throws when tags contains invalid characters", async () => {
        const adapter = new MemoryAdapter();
        const plugin = createTagsPlugin();
        const handler = getHandler("beforeSetItem", plugin);

        await expect(
          handler({
            adapter,
            key: "key",
            value: "value",
            extra: { [TAGS_EXTRA_PROPERTY_NAME]: ["valid", "invalid tag with spaces"] },
          }),
        ).rejects.toThrow("Invalid tags format");
      });

      it("accepts tags with alphanumeric characters, underscores, and hyphens", async () => {
        const adapter = new MemoryAdapter();
        const plugin = createTagsPlugin();
        const handler = getHandler("beforeSetItem", plugin);

        const result = await handler({
          adapter,
          key: "key",
          value: "value",
          extra: { [TAGS_EXTRA_PROPERTY_NAME]: ["Tag1", "tag-2", "tag_3", "TAG123"] },
        });

        expect(result.extra[TAGS_EXTRA_PROPERTY_NAME]).toEqual(["Tag1", "tag-2", "tag_3", "TAG123"]);
      });
    });
  });

  describe("e2e testing", () => {
    let stash: StashIt<TagsExtra>;
    let adapter: MemoryAdapter;

    beforeEach(() => {
      adapter = new MemoryAdapter();
      stash = new StashIt(adapter).use(createTagsPlugin());
    });

    describe("storing items with tags", () => {
      it("stores item with tags in extra", async () => {
        const item = await stash.setItem(
          "movie1",
          { title: "Avengers" },
          {
            __tags: ["movie", "marvel"],
          },
        );

        expect(item.extra.__tags).toEqual(["movie", "marvel"]);
      });

      it("stores item without tags", async () => {
        const item = await stash.setItem("key", "value", { foo: "bar" });

        expect(item.extra).toEqual({ foo: "bar" });
        expect(item.extra.__tags).toBeUndefined();
      });

      it("creates tag indexes when storing items with tags", async () => {
        await stash.setItem(
          "movie1",
          { title: "Avengers" },
          {
            __tags: ["movie", "marvel"],
          },
        );

        // Check the internal indexes
        const movieIndex = await stash.getItem(`${TAGS_INDEX_KEY_PREFIX}movie`);
        const marvelIndex = await stash.getItem(`${TAGS_INDEX_KEY_PREFIX}marvel`);

        expect(movieIndex?.value).toEqual(["movie1"]);
        expect(marvelIndex?.value).toEqual(["movie1"]);
      });

      it("adds key to existing tag index", async () => {
        await stash.setItem(
          "movie1",
          { title: "Avengers" },
          {
            __tags: ["movie"],
          },
        );
        await stash.setItem(
          "movie2",
          { title: "Iron Man" },
          {
            [TAGS_EXTRA_PROPERTY_NAME]: ["movie"],
          },
        );

        const movieIndex = await stash.getItem(`${TAGS_INDEX_KEY_PREFIX}movie`);
        expect(movieIndex?.value).toEqual(["movie1", "movie2"]);
      });

      it("updates tag indexes when updating item tags", async () => {
        await stash.setItem(
          "movie1",
          { title: "Avengers" },
          {
            [TAGS_EXTRA_PROPERTY_NAME]: ["movie", "marvel", "action"],
          },
        );

        // Update with different tags
        await stash.setItem(
          "movie1",
          { title: "Avengers" },
          {
            [TAGS_EXTRA_PROPERTY_NAME]: ["movie", "comedy"],
          },
        );

        // Check indexes were updated
        const movieIndex = await stash.getItem(`${TAGS_INDEX_KEY_PREFIX}movie`);
        const marvelIndex = await stash.getItem(`${TAGS_INDEX_KEY_PREFIX}marvel`);
        const actionIndex = await stash.getItem(`${TAGS_INDEX_KEY_PREFIX}action`);
        const comedyIndex = await stash.getItem(`${TAGS_INDEX_KEY_PREFIX}comedy`);

        expect(movieIndex?.value).toEqual(["movie1"]);
        expect(marvelIndex).toBeUndefined(); // Removed because no items have this tag
        expect(actionIndex).toBeUndefined(); // Removed because no items have this tag
        expect(comedyIndex?.value).toEqual(["movie1"]);
      });

      it("does not duplicate key in index when setting same item multiple times", async () => {
        await stash.setItem(
          "movie1",
          { title: "Avengers" },
          {
            [TAGS_EXTRA_PROPERTY_NAME]: ["movie"],
          },
        );
        await stash.setItem(
          "movie1",
          { title: "Avengers Updated" },
          {
            [TAGS_EXTRA_PROPERTY_NAME]: ["movie"],
          },
        );

        const movieIndex = await stash.getItem(`${TAGS_INDEX_KEY_PREFIX}movie`);
        expect(movieIndex?.value).toEqual(["movie1"]);
      });
    });

    describe("removing items with tags", () => {
      it("removes key from tag indexes when item is removed", async () => {
        await stash.setItem(
          "movie1",
          { title: "Avengers" },
          {
            [TAGS_EXTRA_PROPERTY_NAME]: ["movie", "marvel"],
          },
        );
        await stash.setItem(
          "movie2",
          { title: "Iron Man" },
          {
            [TAGS_EXTRA_PROPERTY_NAME]: ["movie", "marvel"],
          },
        );

        await stash.removeItem("movie1");

        const movieIndex = await stash.getItem(`${TAGS_INDEX_KEY_PREFIX}movie`);
        const marvelIndex = await stash.getItem(`${TAGS_INDEX_KEY_PREFIX}marvel`);

        expect(movieIndex?.value).toEqual(["movie2"]);
        expect(marvelIndex?.value).toEqual(["movie2"]);
      });

      it("removes tag index entirely when last item with that tag is removed", async () => {
        await stash.setItem(
          "movie1",
          { title: "Avengers" },
          {
            [TAGS_EXTRA_PROPERTY_NAME]: ["movie", "action"],
          },
        );
        await stash.setItem(
          "movie2",
          { title: "Iron Man" },
          {
            [TAGS_EXTRA_PROPERTY_NAME]: ["movie"],
          },
        );

        await stash.removeItem("movie1");

        const actionIndex = await stash.getItem(`${TAGS_INDEX_KEY_PREFIX}action`);
        expect(actionIndex).toBeUndefined();
      });

      it("handles removing item without tags", async () => {
        await stash.setItem("key", "value", { foo: "bar" });

        const result = await stash.removeItem("key");

        expect(result).toBe(true);
      });
    });

    describe("getKeysByTags", () => {
      beforeEach(async () => {
        await stash.setItem(
          "movie1",
          { title: "Avengers" },
          {
            [TAGS_EXTRA_PROPERTY_NAME]: ["movie", "marvel", "action"],
          },
        );
        await stash.setItem(
          "movie2",
          { title: "Iron Man" },
          {
            [TAGS_EXTRA_PROPERTY_NAME]: ["movie", "marvel"],
          },
        );
        await stash.setItem(
          "movie3",
          { title: "Comedy Film" },
          {
            [TAGS_EXTRA_PROPERTY_NAME]: ["movie", "comedy"],
          },
        );
        await stash.setItem(
          "song1",
          { title: "Rock Song" },
          {
            [TAGS_EXTRA_PROPERTY_NAME]: ["music", "rock"],
          },
        );
      });

      describe("mode: any (default)", () => {
        it("returns keys with any of the specified tags", async () => {
          const keys = await getKeysByTags(stash, ["marvel"]);

          expect(keys).toEqual(expect.arrayContaining(["movie1", "movie2"]));
          expect(keys).toHaveLength(2);
        });

        it("returns unique keys when searching multiple tags", async () => {
          const keys = await getKeysByTags(stash, ["marvel", "comedy"]);

          expect(keys).toEqual(expect.arrayContaining(["movie1", "movie2", "movie3"]));
          expect(keys).toHaveLength(3);
        });

        it("returns empty array when no items match", async () => {
          const keys = await getKeysByTags(stash, ["nonexistent"]);

          expect(keys).toEqual([]);
        });

        it("returns empty array when tags array is empty", async () => {
          const keys = await getKeysByTags(stash, []);

          expect(keys).toEqual([]);
        });
      });

      describe("mode: all", () => {
        it("returns keys that have ALL specified tags", async () => {
          const keys = await getKeysByTags(stash, ["movie", "marvel"], "all");

          expect(keys).toEqual(expect.arrayContaining(["movie1", "movie2"]));
          expect(keys).toHaveLength(2);
        });

        it("returns only keys that have all tags", async () => {
          const keys = await getKeysByTags(stash, ["movie", "marvel", "action"], "all");

          expect(keys).toEqual(["movie1"]);
        });

        it("returns empty array when no items have all tags", async () => {
          const keys = await getKeysByTags(stash, ["movie", "rock"], "all");

          expect(keys).toEqual([]);
        });

        it("returns empty array when one of the tags has no items", async () => {
          const keys = await getKeysByTags(stash, ["movie", "nonexistent"], "all");

          expect(keys).toEqual([]);
        });
      });

      describe("validation", () => {
        it("throws when tags contain invalid characters", async () => {
          await expect(getKeysByTags(stash, ["invalid tag"])).rejects.toThrow("Invalid tags format");
        });

        it("throws when tags contain empty string", async () => {
          await expect(getKeysByTags(stash, ["valid", ""])).rejects.toThrow("Invalid tags format");
        });
      });
    });

    describe("removeByTags", () => {
      beforeEach(async () => {
        await stash.setItem(
          "movie1",
          { title: "Avengers" },
          {
            [TAGS_EXTRA_PROPERTY_NAME]: ["movie", "marvel", "action"],
          },
        );
        await stash.setItem(
          "movie2",
          { title: "Iron Man" },
          {
            [TAGS_EXTRA_PROPERTY_NAME]: ["movie", "marvel"],
          },
        );
        await stash.setItem(
          "movie3",
          { title: "Comedy Film" },
          {
            [TAGS_EXTRA_PROPERTY_NAME]: ["movie", "comedy"],
          },
        );
        await stash.setItem(
          "song1",
          { title: "Rock Song" },
          {
            [TAGS_EXTRA_PROPERTY_NAME]: ["music", "rock"],
          },
        );
      });

      describe("mode: any (default)", () => {
        it("removes items with any of the specified tags", async () => {
          const result = await removeByTags(stash, ["marvel"]);

          expect(result.removedKeys).toEqual(expect.arrayContaining(["movie1", "movie2"]));
          expect(result.removedKeys).toHaveLength(2);
          expect(result.notFoundKeys).toEqual([]);

          // Verify items are removed
          expect(await stash.getItem("movie1")).toBeUndefined();
          expect(await stash.getItem("movie2")).toBeUndefined();
          expect(await stash.getItem("movie3")).toBeDefined();
          expect(await stash.getItem("song1")).toBeDefined();
        });

        it("removes items with any of multiple tags", async () => {
          const result = await removeByTags(stash, ["action", "comedy"]);

          expect(result.removedKeys).toEqual(expect.arrayContaining(["movie1", "movie3"]));
          expect(result.removedKeys).toHaveLength(2);
        });

        it("returns empty result when no items match", async () => {
          const result = await removeByTags(stash, ["nonexistent"]);

          expect(result.removedKeys).toEqual([]);
          expect(result.notFoundKeys).toEqual([]);
        });

        it("cleans up tag indexes after removal", async () => {
          await removeByTags(stash, ["action"]);

          const actionIndex = await stash.getItem(`${TAGS_INDEX_KEY_PREFIX}action`);
          expect(actionIndex).toBeUndefined();
        });
      });

      describe("mode: all", () => {
        it("removes only items that have ALL specified tags", async () => {
          const result = await removeByTags(stash, ["movie", "marvel", "action"], "all");

          expect(result.removedKeys).toEqual(["movie1"]);

          // Verify only movie1 is removed
          expect(await stash.getItem("movie1")).toBeUndefined();
          expect(await stash.getItem("movie2")).toBeDefined();
          expect(await stash.getItem("movie3")).toBeDefined();
        });

        it("removes multiple items that have all tags", async () => {
          const result = await removeByTags(stash, ["movie", "marvel"], "all");

          expect(result.removedKeys).toEqual(expect.arrayContaining(["movie1", "movie2"]));
          expect(result.removedKeys).toHaveLength(2);
        });
      });

      describe("validation", () => {
        it("throws when tags contain invalid characters", async () => {
          await expect(removeByTags(stash, ["invalid tag"])).rejects.toThrow("Invalid tags format");
        });
      });
    });

    describe("edge cases", () => {
      it("handles item with empty tags array", async () => {
        const item = await stash.setItem("key", "value", {
          [TAGS_EXTRA_PROPERTY_NAME]: [],
        });

        expect(item.extra[TAGS_EXTRA_PROPERTY_NAME]).toEqual([]);

        // Should not create any indexes
        const keys = await getKeysByTags(stash, ["anyTag"]);
        expect(keys).toEqual([]);
      });

      it("handles updating item to remove all tags", async () => {
        await stash.setItem(
          "movie1",
          { title: "Avengers" },
          {
            [TAGS_EXTRA_PROPERTY_NAME]: ["movie", "marvel"],
          },
        );

        // Update with no tags
        await stash.setItem(
          "movie1",
          { title: "Avengers" },
          {
            [TAGS_EXTRA_PROPERTY_NAME]: [],
          },
        );

        const movieIndex = await stash.getItem(`${TAGS_INDEX_KEY_PREFIX}movie`);
        const marvelIndex = await stash.getItem(`${TAGS_INDEX_KEY_PREFIX}marvel`);

        expect(movieIndex).toBeUndefined();
        expect(marvelIndex).toBeUndefined();
      });

      it("handles updating item to add tags to previously untagged item", async () => {
        await stash.setItem("key", "value", { foo: "bar" });

        // This won't work because the plugin doesn't track items without __tags
        // The user would need to set the item again with tags
        await stash.setItem("key", "value", {
          foo: "bar",
          [TAGS_EXTRA_PROPERTY_NAME]: ["newTag"],
        });

        const keys = await getKeysByTags(stash, ["newTag"]);
        expect(keys).toEqual(["key"]);
      });

      it("handles multiple items with the same tag", async () => {
        // Set multiple items with the same tag sequentially
        // Note: Concurrent operations may have race conditions due to the read-modify-write
        // pattern used for tag indexes. For concurrent operations, use proper locking.
        await stash.setItem("item1", "value1", { [TAGS_EXTRA_PROPERTY_NAME]: ["shared"] });
        await stash.setItem("item2", "value2", { [TAGS_EXTRA_PROPERTY_NAME]: ["shared"] });
        await stash.setItem("item3", "value3", { [TAGS_EXTRA_PROPERTY_NAME]: ["shared"] });

        const keys = await getKeysByTags(stash, ["shared"]);
        expect(keys).toHaveLength(3);
        expect(keys).toEqual(expect.arrayContaining(["item1", "item2", "item3"]));
      });
    });

    describe("withTags helper", () => {
      it("creates extra object with tags", () => {
        const extra = withTags(["movie", "action"]);

        expect(extra).toEqual({ __tags: ["movie", "action"] });
      });

      it("merges tags with existing extra properties", () => {
        const extra = withTags(["movie"], { rating: 5, year: 2024 });

        expect(extra).toEqual({
          __tags: ["movie"],
          rating: 5,
          year: 2024,
        });
      });

      it("works with stash.setItem", async () => {
        const item = await stash.setItem("movie1", { title: "Avengers" }, withTags(["movie", "marvel"]));

        expect(item.extra.__tags).toEqual(["movie", "marvel"]);

        const keys = await getKeysByTags(stash, ["marvel"]);
        expect(keys).toEqual(["movie1"]);
      });

      it("works with additional extra properties and stash.setItem", async () => {
        const item = await stash.setItem("movie1", { title: "Avengers" }, withTags(["movie"], { rating: 5 }));

        expect(item.extra.__tags).toEqual(["movie"]);
        expect(item.extra.rating).toEqual(5);
      });
    });

    describe("getItemTags helper", () => {
      it("extracts tags from an item", async () => {
        await stash.setItem("movie1", { title: "Avengers" }, withTags(["movie", "marvel"]));
        const item = await stash.getItem("movie1");

        const tags = getItemTags(item);

        expect(tags).toEqual(["movie", "marvel"]);
      });

      it("returns empty array for undefined item", () => {
        const tags = getItemTags(undefined);

        expect(tags).toEqual([]);
      });

      it("returns empty array for item without tags", async () => {
        await stash.setItem("key", "value", { foo: "bar" });
        const item = await stash.getItem("key");

        const tags = getItemTags(item);

        expect(tags).toEqual([]);
      });

      it("returns empty array for item with invalid tags format in extra", () => {
        // Simulate an item with invalid tags format (e.g., from external source)
        const itemWithInvalidTags = {
          key: "key",
          value: "value",
          extra: { __tags: "not-an-array" },
        };

        const tags = getItemTags(itemWithInvalidTags);

        expect(tags).toEqual([]);
      });
    });
  });
});
