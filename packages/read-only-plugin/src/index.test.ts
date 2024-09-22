import { describe, it, expect, vi } from "vitest";
import { getHandler } from "@stash-it/dev-tools";
import { StashIt } from "@stash-it/stash-it";
import { MemoryAdapter } from "@stash-it/memory-adapter";

import { createReadOnlyPlugin } from "./index";

describe("read-only-plugin", () => {
  it("throws when any change is about to be made", () => {
    const key = "key";
    const value = "value";
    const extra = { some: "extra value" };
    const adapter = new MemoryAdapter();

    const readOnlyPlugin = createReadOnlyPlugin();

    const beforeSetItemHandler = getHandler("beforeSetItem", readOnlyPlugin);
    const beforeRemoveItemHandler = getHandler("beforeRemoveItem", readOnlyPlugin);
    const beforeSetExtraHandler = getHandler("beforeSetExtra", readOnlyPlugin);

    expect(() => beforeSetItemHandler({ key, value, extra, adapter })).rejects.toThrow(
      "Overwriting items is not allowed!",
    );
    expect(() => beforeRemoveItemHandler({ key, adapter })).rejects.toThrow("Removing items is not allowed!");
    expect(() => beforeSetExtraHandler({ key, extra, adapter })).rejects.toThrow(
      "Overwriting data in items is not allowed!",
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

  it("allows customizing error messages", () => {
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

    expect(() => beforeSetItemHandler({ key, value, extra, adapter })).rejects.toThrow(
      "Custom set item error message.",
    );
    expect(() => beforeRemoveItemHandler({ key, adapter })).rejects.toThrow("Custom remove item error message.");
    expect(() => beforeSetExtraHandler({ key, extra, adapter })).rejects.toThrow("Custom set extra error message.");
  });
});
