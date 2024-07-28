import { describe, it, expect } from "vitest";

import { MemoryAdapter } from "./index";

describe("MemoryAdapter", () => {
  describe("setting and getting an item", () => {
    it("should be able to get an existing item", async () => {
      const adapter = new MemoryAdapter();
      const key = "key";
      const value = "value";
      const extra = { foo: "bar" };

      await adapter.setItem(key, value, extra);

      const item = await adapter.getItem(key);

      expect(item).toEqual({ key, value, extra });
    });

    it("should return undefined when item does not exist", async () => {
      const adapter = new MemoryAdapter();

      const item = await adapter.getItem("non-existing-key");

      expect(item).toBeUndefined();
    });

    it("setting an item for existing key should overwrite the existing item", async () => {
      const adapter = new MemoryAdapter();
      const key = "key";
      const value = "value";
      const extra = { foo: "bar" };

      await adapter.setItem(key, value, extra);

      const newValue = "new value";
      const newExtra = { foo: "baz" };

      await adapter.setItem(key, newValue, newExtra);

      const item = await adapter.getItem(key);

      expect(item).toEqual({ key, value: newValue, extra: newExtra });
    });
  });

  describe("setting and getting extra", () => {
    it("should be able to set extra for an existing item", async () => {
      const adapter = new MemoryAdapter();
      const key = "key";
      const value = "value";

      await adapter.setItem(key, value);

      const extra = { foo: "bar" };

      await adapter.setExtra(key, extra);

      const extraSetOnItem = await adapter.getExtra(key);

      expect(extraSetOnItem).toEqual(extra);
    });

    it("should not be able to set extra on non-existing item", async () => {
      const adapter = new MemoryAdapter();
      const key = "non-existing-key";
      const extra = { foo: "bar" };

      const result = await adapter.setExtra(key, extra);

      expect(result).toBe(false);
    });

    it("setting extra should overwrite the existing extra", async () => {
      const adapter = new MemoryAdapter();
      const key = "key";
      const value = "value";
      const extra = { foo: "bar" };

      await adapter.setItem(key, value, extra);

      const newExtra = { baz: "bam" };

      await adapter.setExtra(key, newExtra);

      const extraSetOnItem = await adapter.getExtra(key);

      expect(extraSetOnItem).toEqual(newExtra);
    });
  });

  describe("removing an item", () => {
    it("should be able to remove an existing item", async () => {
      const adapter = new MemoryAdapter();
      const key = "key";
      const value = "value";

      await adapter.setItem(key, value);

      const check = await adapter.hasItem(key);
      expect(check).toBe(true);

      await adapter.removeItem(key);

      const item = await adapter.getItem(key);

      expect(item).toBeUndefined();
    });

    it("should return false when trying to remove non-existing item", async () => {
      const adapter = new MemoryAdapter();

      const result = await adapter.removeItem("non-existing-key");

      expect(result).toBe(false);
    });
  });

  describe("checking if item exists", () => {
    it("should return true for existing item", async () => {
      const adapter = new MemoryAdapter();
      const key = "key";
      const value = "value";

      await adapter.setItem(key, value);

      const check = await adapter.hasItem(key);

      expect(check).toBe(true);
    });

    it("should return false for non-existing item", async () => {
      const adapter = new MemoryAdapter();

      const check = await adapter.hasItem("non-existing-key");

      expect(check).toBe(false);
    });
  });

  describe("removing an item", () => {
    it("should return true when removing an existing item", async () => {
      const adapter = new MemoryAdapter();
      const key = "key";
      const value = "value";

      await adapter.setItem(key, value);

      const result = await adapter.removeItem(key);

      expect(result).toBe(true);
    });

    it("should return false when removing non-existing item", async () => {
      const adapter = new MemoryAdapter();

      const result = await adapter.removeItem("non-existing-key");

      expect(result).toBe(false);
    });
  });
});
