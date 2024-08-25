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
  });

  describe("when suffix is set", () => {
    it("builds key with set suffix", async () => {
      const plugin = createPrefixSuffixPlugin({ suffix: "-suffix" });
      const key = "key";
      const handler = getHandler("buildKey", plugin);

      const result = await handler({ adapter, key });

      expect(result.key).toEqual(`${key}-suffix`);
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
  });
});
