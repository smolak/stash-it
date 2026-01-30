import { getHandler } from "@stash-it/dev-tools";
import { MemoryAdapter } from "@stash-it/memory-adapter";
import { StashIt } from "@stash-it/stash-it";
import { describe, expect, it } from "vitest";

import { ZodError } from "zod";
import { createReadOnlyPlugin } from "./index";

describe("read-only-plugin", () => {
  it("throws when any change is about to be made", async () => {
    const key = "key";
    const value = "value";
    const extra = { some: "extra value" };
    const adapter = new MemoryAdapter();

    const readOnlyPlugin = createReadOnlyPlugin();

    const beforeSetItemHandler = getHandler("beforeSetItem", readOnlyPlugin);
    const beforeRemoveItemHandler = getHandler("beforeRemoveItem", readOnlyPlugin);
    const beforeSetExtraHandler = getHandler("beforeSetExtra", readOnlyPlugin);

    await expect(beforeSetItemHandler({ key, value, extra, adapter })).rejects.toThrow(
      expect.objectContaining({ message: expect.stringContaining("Overwriting items is not allowed!") }),
    );
    await expect(beforeRemoveItemHandler({ key, adapter })).rejects.toThrow(
      expect.objectContaining({ message: expect.stringContaining("Removing items is not allowed!") }),
    );
    await expect(beforeSetExtraHandler({ key, extra, adapter })).rejects.toThrow(
      expect.objectContaining({ message: expect.stringContaining("Overwriting data in items is not allowed!") }),
    );
  });

  it('allows to execute all of the "read" operations and returns expected values', async () => {
    const adapter = new MemoryAdapter();
    const stash = new StashIt(adapter);
    const readOnlyPlugin = createReadOnlyPlugin();

    // Pre-populate data before applying read-only plugin
    await adapter.setItem("existing-key", "value", { some: "extra" });

    stash.registerPlugins([readOnlyPlugin]);

    // Test read operations return expected values
    const item = await stash.getItem("existing-key");
    expect(item).toEqual({ key: "existing-key", value: "value", extra: { some: "extra" } });

    const exists = await stash.hasItem("existing-key");
    expect(exists).toBe(true);

    const doesNotExist = await stash.hasItem("non-existing-key");
    expect(doesNotExist).toBe(false);

    const extra = await stash.getExtra("existing-key");
    expect(extra).toEqual({ some: "extra" });

    const nonExistingItem = await stash.getItem("non-existing-key");
    expect(nonExistingItem).toBeUndefined();

    const nonExistingExtra = await stash.getExtra("non-existing-key");
    expect(nonExistingExtra).toBeUndefined();
  });

  it("allows customizing error messages", async () => {
    const key = "key";
    const value = "value";
    const extra = { some: "extra value" };
    const adapter = new MemoryAdapter();

    const readOnlyPlugin = createReadOnlyPlugin({
      setItemErrorMessage: "Custom set item error message.",
      removeItemErrorMessage: "Custom remove item error message.",
      setExtraErrorMessage: "Custom set extra error message.",
    });

    const beforeSetItemHandler = getHandler("beforeSetItem", readOnlyPlugin);
    const beforeRemoveItemHandler = getHandler("beforeRemoveItem", readOnlyPlugin);
    const beforeSetExtraHandler = getHandler("beforeSetExtra", readOnlyPlugin);

    await expect(beforeSetItemHandler({ key, value, extra, adapter })).rejects.toThrow(
      expect.objectContaining({ message: expect.stringContaining("Custom set item error message.") }),
    );
    await expect(beforeRemoveItemHandler({ key, adapter })).rejects.toThrow(
      expect.objectContaining({ message: expect.stringContaining("Custom remove item error message.") }),
    );
    await expect(beforeSetExtraHandler({ key, extra, adapter })).rejects.toThrow(
      expect.objectContaining({ message: expect.stringContaining("Custom set extra error message.") }),
    );
  });

  describe("validation", () => {
    it("throws when setItemErrorMessage is an empty string", () => {
      expect(() => createReadOnlyPlugin({ setItemErrorMessage: "" })).toThrow(ZodError);
    });

    it("throws when removeItemErrorMessage is an empty string", () => {
      expect(() => createReadOnlyPlugin({ removeItemErrorMessage: "" })).toThrow(ZodError);
    });

    it("throws when setExtraErrorMessage is an empty string", () => {
      expect(() => createReadOnlyPlugin({ setExtraErrorMessage: "" })).toThrow(ZodError);
    });

    it("throws when setItemErrorMessage is whitespace only", () => {
      expect(() => createReadOnlyPlugin({ setItemErrorMessage: "   " })).toThrow(ZodError);
    });

    it("throws when removeItemErrorMessage is whitespace only", () => {
      expect(() => createReadOnlyPlugin({ removeItemErrorMessage: "   " })).toThrow(ZodError);
    });

    it("throws when setExtraErrorMessage is whitespace only", () => {
      expect(() => createReadOnlyPlugin({ setExtraErrorMessage: "   " })).toThrow(ZodError);
    });
  });
});
