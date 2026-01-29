import { getHandler } from "@stash-it/dev-tools";
import { MemoryAdapter } from "@stash-it/memory-adapter";
import { StashIt } from "@stash-it/stash-it";
import { describe, expect, it, vi } from "vitest";

import { createLoggerPlugin } from "./index";

describe("logger-plugin", () => {
  it("calls log function with hook name and args passed to that hook", async () => {
    const key = "key";
    const value = "value";
    const extra = { some: "extra value" };
    const item = { key, value, extra };

    // Any adapter will do
    const adapter = new MemoryAdapter();
    const adapterClassName = adapter.constructor.name;

    const logFunction = vi.fn();
    const plugin = createLoggerPlugin(logFunction);

    const buildKeyHandler = getHandler("buildKey", plugin);
    await buildKeyHandler({ adapter, key });
    expect(logFunction).toHaveBeenCalledWith("buildKey", { adapter: adapterClassName, key });

    logFunction.mockReset();

    const beforeSetItemHandler = getHandler("beforeSetItem", plugin);
    await beforeSetItemHandler({ adapter, key, value, extra });
    expect(logFunction).toHaveBeenCalledWith("beforeSetItem", { adapter: adapterClassName, key, value, extra });

    logFunction.mockReset();

    const afterSetItemHandler = getHandler("afterSetItem", plugin);
    await afterSetItemHandler({ adapter, key, value, extra, item });
    expect(logFunction).toHaveBeenCalledWith("afterSetItem", { adapter: adapterClassName, key, value, extra, item });

    logFunction.mockReset();

    const beforeGetItemHandler = getHandler("beforeGetItem", plugin);
    await beforeGetItemHandler({ adapter, key });
    expect(logFunction).toHaveBeenCalledWith("beforeGetItem", { adapter: adapterClassName, key });

    logFunction.mockReset();

    const afterGetItemHandler = getHandler("afterGetItem", plugin);
    await afterGetItemHandler({ adapter, key, item });
    expect(logFunction).toHaveBeenCalledWith("afterGetItem", { adapter: adapterClassName, key, item });

    logFunction.mockReset();

    const beforeHasItemHandler = getHandler("beforeHasItem", plugin);
    await beforeHasItemHandler({ adapter, key });
    expect(logFunction).toHaveBeenCalledWith("beforeHasItem", { adapter: adapterClassName, key });

    logFunction.mockReset();

    const afterHasItemHandler = getHandler("afterHasItem", plugin);
    await afterHasItemHandler({ adapter, key, result: true });
    expect(logFunction).toHaveBeenCalledWith("afterHasItem", { adapter: adapterClassName, key, result: true });

    logFunction.mockReset();

    const beforeRemoveItemHandler = getHandler("beforeRemoveItem", plugin);
    await beforeRemoveItemHandler({ adapter, key });
    expect(logFunction).toHaveBeenCalledWith("beforeRemoveItem", { adapter: adapterClassName, key });

    logFunction.mockReset();

    const afterRemoveItemHandler = getHandler("afterRemoveItem", plugin);
    await afterRemoveItemHandler({ adapter, key, result: true });
    expect(logFunction).toHaveBeenCalledWith("afterRemoveItem", { adapter: adapterClassName, key, result: true });

    logFunction.mockReset();

    const beforeSetExtraHandler = getHandler("beforeSetExtra", plugin);
    await beforeSetExtraHandler({ adapter, key, extra });
    expect(logFunction).toHaveBeenCalledWith("beforeSetExtra", { adapter: adapterClassName, key, extra });

    logFunction.mockReset();

    const afterSetExtraHandler = getHandler("afterSetExtra", plugin);
    await afterSetExtraHandler({ adapter, key, extra });
    expect(logFunction).toHaveBeenCalledWith("afterSetExtra", { adapter: adapterClassName, key, extra });

    logFunction.mockReset();

    const beforeGetExtraHandler = getHandler("beforeGetExtra", plugin);
    await beforeGetExtraHandler({ adapter, key });
    expect(logFunction).toHaveBeenCalledWith("beforeGetExtra", { adapter: adapterClassName, key });

    logFunction.mockReset();

    const afterGetExtraHandler = getHandler("afterGetExtra", plugin);
    await afterGetExtraHandler({ adapter, key, extra });
    expect(logFunction).toHaveBeenCalledWith("afterGetExtra", { adapter: adapterClassName, key, extra });
  });

  describe("e2e testing", () => {
    it("calls log function with hook name and args passed to that hook for each stash-it method", async () => {
      const key = "key";
      const value = "value";
      const extra = { some: "extra value" };
      const item = { key, value, extra };

      const adapter = new MemoryAdapter();
      const adapterClassName = adapter.constructor.name;
      const stash = new StashIt(adapter);
      const logFunction = vi.fn();
      const plugin = createLoggerPlugin(logFunction);

      stash.registerPlugins([plugin]);

      await stash.setItem(key, value, extra);
      expect(logFunction).toHaveBeenCalledWith("beforeSetItem", { adapter: adapterClassName, key, value, extra });
      expect(logFunction).toHaveBeenCalledWith("afterSetItem", { adapter: adapterClassName, key, value, extra, item });

      logFunction.mockReset();

      await stash.getItem(key);
      expect(logFunction).toHaveBeenCalledWith("beforeGetItem", { adapter: adapterClassName, key });
      expect(logFunction).toHaveBeenCalledWith("afterGetItem", { adapter: adapterClassName, key, item });

      logFunction.mockReset();

      await stash.hasItem(key);
      expect(logFunction).toHaveBeenCalledWith("beforeHasItem", { adapter: adapterClassName, key });
      expect(logFunction).toHaveBeenCalledWith("afterHasItem", { adapter: adapterClassName, key, result: true });

      logFunction.mockReset();

      await stash.setExtra(key, extra);
      expect(logFunction).toHaveBeenCalledWith("beforeSetExtra", { adapter: adapterClassName, key, extra });
      expect(logFunction).toHaveBeenCalledWith("afterSetExtra", { adapter: adapterClassName, key, extra });

      logFunction.mockReset();

      await stash.getExtra(key);
      expect(logFunction).toHaveBeenCalledWith("beforeGetExtra", { adapter: adapterClassName, key });
      expect(logFunction).toHaveBeenCalledWith("afterGetExtra", { adapter: adapterClassName, key, extra });

      logFunction.mockReset();

      await stash.removeItem(key);
      expect(logFunction).toHaveBeenCalledWith("beforeRemoveItem", { adapter: adapterClassName, key });
      expect(logFunction).toHaveBeenCalledWith("afterRemoveItem", { adapter: adapterClassName, key, result: true });

      logFunction.mockReset();

      await stash.hasItem(key);
      expect(logFunction).toHaveBeenCalledWith("beforeHasItem", { adapter: adapterClassName, key });
      expect(logFunction).toHaveBeenCalledWith("afterHasItem", { adapter: adapterClassName, key, result: false });

      logFunction.mockReset();

      await stash.getItem(key);
      expect(logFunction).toHaveBeenCalledWith("beforeGetItem", { adapter: adapterClassName, key });
      expect(logFunction).toHaveBeenCalledWith("afterGetItem", { adapter: adapterClassName, key, item: undefined });

      logFunction.mockReset();

      await stash.setExtra(key, extra);
      expect(logFunction).toHaveBeenCalledWith("beforeSetExtra", { adapter: adapterClassName, key, extra });
      expect(logFunction).toHaveBeenCalledWith("afterSetExtra", { adapter: adapterClassName, key, extra: false });

      logFunction.mockReset();

      await stash.getExtra(key);
      expect(logFunction).toHaveBeenCalledWith("beforeGetExtra", { adapter: adapterClassName, key });
      expect(logFunction).toHaveBeenCalledWith("afterGetExtra", { adapter: adapterClassName, key, extra: undefined });

      logFunction.mockReset();

      await stash.removeItem(key);
      expect(logFunction).toHaveBeenCalledWith("beforeRemoveItem", { adapter: adapterClassName, key });
      expect(logFunction).toHaveBeenCalledWith("afterRemoveItem", { adapter: adapterClassName, key, result: false });
    });
  });
});
