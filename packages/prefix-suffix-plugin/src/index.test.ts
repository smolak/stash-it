import { describe, it, expect } from "vitest";

import { createPrefixSuffixPlugin } from "./index";
import { getHandler } from "@stash-it/core";

describe("prefix-suffix-plugin", () => {
  describe("when prefix is set", () => {
    it("builds key with set prefix", async () => {
      const plugin = createPrefixSuffixPlugin({ prefix: "prefix-" });
      const key = "key";
      const handler = getHandler("buildKey", plugin);

      const result = await handler({ key });

      expect(result.key).toEqual(`prefix-${key}`);
    });
  });

  describe("when suffix is set", () => {
    it("builds key with set suffix", async () => {
      const plugin = createPrefixSuffixPlugin({ suffix: "-suffix" });
      const key = "key";
      const handler = getHandler("buildKey", plugin);

      const result = await handler({ key });

      expect(result.key).toEqual(`${key}-suffix`);
    });
  });

  describe("when prefix and suffix are set", () => {
    it("builds key with set prefix and suffix", async () => {
      const plugin = createPrefixSuffixPlugin({ prefix: "prefix-", suffix: "-suffix" });
      const key = "key";
      const handler = getHandler("buildKey", plugin);

      const result = await handler({ key });

      expect(result.key).toEqual(`prefix-${key}-suffix`);
    });
  });
});
