import { getHandler } from "@stash-it/dev-tools";
import { MemoryAdapter } from "@stash-it/memory-adapter";
import { StashIt } from "@stash-it/stash-it";
import { describe, expect, it } from "vitest";

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

  it('allows to execute all of the "read" operations', () => {
    const stash = new StashIt(new MemoryAdapter());
    const readOnlyPlugin = createReadOnlyPlugin();

    stash.registerPlugins([readOnlyPlugin]);

    expect(() => stash.getItem("key")).not.toThrow();
    expect(() => stash.hasItem("key")).not.toThrow();
    expect(() => stash.getExtra("key")).not.toThrow();
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
});
