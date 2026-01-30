import type { Hook } from "@stash-it/core";
import { getHandler } from "@stash-it/dev-tools";
import { MemoryAdapter } from "@stash-it/memory-adapter";
import { StashIt } from "@stash-it/stash-it";
import { describe, expect, it, vi } from "vitest";

import { createLoggerPlugin } from "./index";

describe("logger-plugin", () => {
  const key = "key";
  const value = "value";
  const extra = { some: "extra value" };
  const item = { key, value, extra };

  // Any adapter will do
  const adapter = new MemoryAdapter();
  const adapterClassName = adapter.constructor.name;

  describe("hook handlers", () => {
    const testCases: Array<{
      hook: Hook;
      args: Record<string, unknown>;
      expectedLogArgs: Record<string, unknown>;
    }> = [
      {
        hook: "buildKey",
        args: { key },
        expectedLogArgs: { adapter: adapterClassName, key },
      },
      {
        hook: "beforeSetItem",
        args: { key, value, extra },
        expectedLogArgs: { adapter: adapterClassName, key, value, extra },
      },
      {
        hook: "afterSetItem",
        args: { key, value, extra, item },
        expectedLogArgs: { adapter: adapterClassName, key, value, extra, item },
      },
      {
        hook: "beforeGetItem",
        args: { key },
        expectedLogArgs: { adapter: adapterClassName, key },
      },
      {
        hook: "afterGetItem",
        args: { key, item },
        expectedLogArgs: { adapter: adapterClassName, key, item },
      },
      {
        hook: "beforeHasItem",
        args: { key },
        expectedLogArgs: { adapter: adapterClassName, key },
      },
      {
        hook: "afterHasItem",
        args: { key, result: true },
        expectedLogArgs: { adapter: adapterClassName, key, result: true },
      },
      {
        hook: "beforeRemoveItem",
        args: { key },
        expectedLogArgs: { adapter: adapterClassName, key },
      },
      {
        hook: "afterRemoveItem",
        args: { key, result: true },
        expectedLogArgs: { adapter: adapterClassName, key, result: true },
      },
      {
        hook: "beforeSetExtra",
        args: { key, extra },
        expectedLogArgs: { adapter: adapterClassName, key, extra },
      },
      {
        hook: "afterSetExtra",
        args: { key, extra },
        expectedLogArgs: { adapter: adapterClassName, key, extra },
      },
      {
        hook: "beforeGetExtra",
        args: { key },
        expectedLogArgs: { adapter: adapterClassName, key },
      },
      {
        hook: "afterGetExtra",
        args: { key, extra },
        expectedLogArgs: { adapter: adapterClassName, key, extra },
      },
    ];

    it.each(testCases)("$hook handler calls log function with hook name and args", async ({
      hook,
      args,
      expectedLogArgs,
    }) => {
      const logFunction = vi.fn();
      const plugin = createLoggerPlugin(logFunction);

      const handler = getHandler(hook, plugin);
      // Type assertion needed as we're using a generic test data structure
      // biome-ignore lint/suspicious/noExplicitAny: Test data structure requires flexibility
      await handler({ adapter, ...args } as any);

      expect(logFunction).toHaveBeenCalledWith(hook, expectedLogArgs);
    });
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
