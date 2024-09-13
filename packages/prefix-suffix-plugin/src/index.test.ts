import { describe, it, expect } from "vitest";
import { getHandler } from "@stash-it/dev-tools";
import { StashIt } from "@stash-it/stash-it";
import { MemoryAdapter } from "@stash-it/memory-adapter";

import { createPrefixSuffixPlugin } from "./index";

// Any adapter can be used here.
const adapter = new MemoryAdapter();

describe("prefix-suffix-plugin", () => {
  describe("when prefix is set", () => {
    it("builds key with set prefix", async () => {
      const plugin = createPrefixSuffixPlugin({ prefix: "prefix-" });
      const key = "key";
      const handler = getHandler("buildKey", plugin);

      const result = await handler({ adapter, key });

      expect(result.key).toEqual(`prefix-${key}`);
    });

    describe('after setting an item', () => {
      it("prefix is dropped from key, as prefix is used only internally", async () => {
        const plugin = createPrefixSuffixPlugin({ prefix: "prefix-" });
        const key = "prefix-key";
        const value = "value";
        const extra = {};
        const item = { key, value, extra };
        const handler = getHandler("afterSetItem", plugin);
  
        const result = await handler({ adapter, key, value, extra, item });
  
        expect(result.key).toEqual('key');
        expect(result.item.key).toEqual('key');
      });
    });

    describe('after getting an item', () => {
      it("prefix is dropped from key, as prefix is used only internally", async () => {
        const plugin = createPrefixSuffixPlugin({ prefix: "prefix-" });
        const key = "prefix-key";
        const value = "value";
        const extra = {};
        const item = { key, value, extra };
        const handler = getHandler("afterGetItem", plugin);
  
        const result = await handler({ adapter, key, item });
  
        expect(result.key).toEqual('key');
        expect(result.item?.key).toEqual('key');
      });
    });
  });

  describe("when suffix is set", () => {
    it("builds key with set suffix", async () => {
      const plugin = createPrefixSuffixPlugin({ suffix: "-suffix" });
      const key = "key";
      const handler = getHandler("buildKey", plugin);

      const result = await handler({ adapter, key });

      expect(result.key).toEqual(`${key}-suffix`);
    });

    describe('after setting an item', () => {
      it("prefix is dropped from key, as prefix is used only internally", async () => {
        const plugin = createPrefixSuffixPlugin({ suffix: "-suffix" });
        const key = "key-suffix";
        const value = "value";
        const extra = {};
        const item = { key, value, extra };
        const handler = getHandler("afterSetItem", plugin);
  
        const result = await handler({ adapter, key, value, extra, item });
  
        expect(result.key).toEqual('key');
        expect(result.item.key).toEqual('key');
      });
    });

    describe('after getting an item', () => {
      it("prefix is dropped from key, as prefix is used only internally", async () => {
        const plugin = createPrefixSuffixPlugin({ suffix: "-suffix" });
        const key = "key-suffix";
        const value = "value";
        const extra = {};
        const item = { key, value, extra };
        const handler = getHandler("afterGetItem", plugin);
  
        const result = await handler({ adapter, key, item });
  
        expect(result.key).toEqual('key');
        expect(result.item?.key).toEqual('key');
      });
    });
  });

  describe("when prefix and suffix are set", () => {
    it("builds key with set prefix and suffix", async () => {
      const plugin = createPrefixSuffixPlugin({ prefix: "prefix-", suffix: "-suffix" });
      const key = "key";
      const handler = getHandler("buildKey", plugin);

      const result = await handler({ adapter, key });

      expect(result.key).toEqual(`prefix-${key}-suffix`);
    });

    describe('after setting an item', () => {
      it("prefix and suffix are dropped from key, as they are used only internally", async () => {
        const plugin = createPrefixSuffixPlugin({ prefix: 'prefix-', suffix: "-suffix" });
        const key = "prefix-key-suffix";
        const value = "value";
        const extra = {};
        const item = { key, value, extra };
        const handler = getHandler("afterSetItem", plugin);
  
        const result = await handler({ adapter, key, value, extra, item });
  
        expect(result.key).toEqual('key');
        expect(result.item.key).toEqual('key');
      });
    });

    describe('after getting an item', () => {
      it("prefix and suffix are dropped from key, as they are used only internally", async () => {
        const plugin = createPrefixSuffixPlugin({ prefix: 'prefix-', suffix: "-suffix" });
        const key = "prefix-key-suffix";
        const value = "value";
        const extra = {};
        const item = { key, value, extra };
        const handler = getHandler("afterGetItem", plugin);
  
        const result = await handler({ adapter, key, item });
  
        expect(result.key).toEqual('key');
        expect(result.item?.key).toEqual('key');
      });
    });
  });

  describe("when neither prefix nor suffix is set", () => {
    it("throws an error", () => {
      expect(() => createPrefixSuffixPlugin({})).toThrowErrorMatchingSnapshot();
    });
  });

  describe("e2e testing", () => {
    it("setting and getting an item returns an item with `key` property neither prefixed nor suffixed", async () => {
      const stash = new StashIt(new MemoryAdapter());
      stash.registerPlugins([createPrefixSuffixPlugin({ prefix: "prefix-", suffix: "-suffix" })]);

      const key = "key";

      const createdItem = await stash.setItem(key, "value");
      const retrievedItem = await stash.getItem(key);

      expect(createdItem.key).toEqual(key);
      expect(retrievedItem?.key).toEqual(key);
    });

    it("using sames storage and different prefixes allows for setting/getting items for the same key", async () => {
      // Simulating single storage by using the same memory for each instance of stash-it
      // otherwise those would be different storages (different memory allocations).
      const adapter = new MemoryAdapter();

      const stash1 = new StashIt(adapter);
      const stash2 = new StashIt(adapter);

      const plugin1 = createPrefixSuffixPlugin({ prefix: "prefix1-" });
      const plugin2 = createPrefixSuffixPlugin({ prefix: "prefix2-" });

      stash1.registerPlugins([plugin1]);
      stash2.registerPlugins([plugin2]);

      await stash1.setItem("key", "value1");
      await stash2.setItem("key", "value2");

      expect(stash1.hasItem("key")).resolves.toBe(true);
      expect(stash2.hasItem("key")).resolves.toBe(true);

      const item1 = await stash1.getItem("key");
      const item2 = await stash2.getItem("key");

      expect(item1?.value).not.toEqual(item2?.value);

      await stash1.removeItem("key");

      expect(stash1.hasItem("key")).resolves.toBe(false);
      expect(stash2.hasItem("key")).resolves.toBe(true);
    });
  });
});
