import type { StashItAdapterInterface, StashItPlugin } from "@stash-it/core";
import { toHaveBeenCalledAfter, toHaveBeenCalledBefore } from "jest-extended";
import { describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { StashIt } from "./index";

expect.extend({ toHaveBeenCalledBefore, toHaveBeenCalledAfter });

const key = "key";
const value = "value";
const extra = { foo: "bar" };
const item = { key, value, extra };

describe("stash-it class", () => {
  describe("because adapter is passed to hook handlers", () => {
    it("should not be possible to alter it (plugins could try to do it)", async () => {
      const plugin: StashItPlugin = {
        hookHandlers: {
          beforeSetItem: async (args) => {
            // @ts-expect-error
            args.adapter.getItem = null;

            return args;
          },
        },
      };

      const adapter = createDummyAdapter();
      const stashIt = new StashIt(adapter);

      stashIt.registerPlugins([plugin]);

      await expect(stashIt.setItem(key, value, extra)).rejects.toThrow(
        expect.objectContaining({ message: expect.stringContaining("Cannot assign to read only property 'getItem'") }),
      );
    });
  });

  describe("checkStorage", () => {
    it("calls checkStorage on the adapter, to check if storage the adapter uses is fine", async () => {
      const adapter = createDummyAdapter();
      const stashIt = new StashIt(adapter);

      await stashIt.checkStorage();

      expect(adapter.checkStorage).toHaveBeenCalledOnce();
    });
  });

  describe("buildKey hook", () => {
    describe("when a handler is registered for buildKey hook", () => {
      it("should be used to build the key", async () => {
        const buildKeyHookHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            buildKey: buildKeyHookHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.setItem(key, value, extra);

        // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
        // as vitest internals want to do something with adapter, and it being frozen, throws an error.
        // That way, it doesn't.
        expect(buildKeyHookHandler).toHaveBeenCalled();

        const args = buildKeyHookHandler.mock.calls[0]?.[0];
        expect(args).toEqual({ adapter, key });
      });
    });
  });

  describe("setItem method", () => {
    it("should set an item using the adapter and return it", async () => {
      const adapter = createDummyAdapter();
      const stashIt = new StashIt(adapter);

      const itemSet = await stashIt.setItem(key, value, extra);

      expect(adapter.setItem).toHaveBeenCalledWith(key, value, extra);
      expect(itemSet).toEqual(item);
    });

    it("should connect to the storage, perform the action on the adapter, and disconnect afterwards", async () => {
      const adapter = createDummyAdapter();
      const stashIt = new StashIt(adapter);

      await stashIt.setItem(key, value, extra);

      expect(adapter.connect).toHaveBeenCalledBefore(adapter.setItem);
      expect(adapter.setItem).toHaveBeenCalledBefore(adapter.disconnect);
      expect(adapter.disconnect).toHaveBeenCalledAfter(adapter.setItem);
    });

    describe("error handling", () => {
      describe("when one of the hook handlers throws", () => {
        it("adapter disconnects, and error is rethrown", () => {
          const plugin: StashItPlugin = {
            hookHandlers: {
              afterSetItem: () => {
                throw new Error("Something went wrong...");
              },
            },
          };

          const adapter = createDummyAdapter();
          const stashIt = new StashIt(adapter);
          stashIt.registerPlugins([plugin]);

          stashIt.setItem("any_key", "any_value").catch((error) => {
            expect(error.message).toEqual("Something went wrong...");
            expect(adapter.disconnect).toHaveBeenCalled();
            expect(adapter.disconnect).toHaveBeenCalledAfter(adapter.setItem);
          });
        });
      });
    });

    it("flow of data through hooks", async () => {
      const buildKeyHookHandler = vi.fn().mockResolvedValueOnce({ key: "buildKey-key" });
      const beforeSetItemHookHandler = vi.fn().mockResolvedValueOnce({
        key: "beforeSetItem-key",
        value: "beforeSetItem-value",
        extra: { beforeSetItem: "extra" },
      });
      const afterSetItemHookHandler = vi.fn().mockResolvedValueOnce({
        key: "afterSetItem-key",
        value: "afterSetItem-value",
        extra: { afterSetItem: "extra" },
        item: {
          key: "afterSetItem-key",
          value: "afterSetItem-value",
          extra: { afterSetItem: "extra" },
        },
      });

      const plugin: StashItPlugin = {
        hookHandlers: {
          buildKey: buildKeyHookHandler,
          beforeSetItem: beforeSetItemHookHandler,
          afterSetItem: afterSetItemHookHandler,
        },
      };

      const adapter = createDummyAdapter();
      const stashIt = new StashIt(adapter);
      stashIt.registerPlugins([plugin]);

      const itemSet = await stashIt.setItem(key, value, extra);

      // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
      // as vitest internals want to do something with adapter, and it being frozen, throws an error.
      // That way, it doesn't.
      const buildKeyHookHandlerArgs = buildKeyHookHandler.mock.calls[0]?.[0];
      expect(buildKeyHookHandler).toHaveBeenCalled();
      expect(buildKeyHookHandlerArgs).toEqual({ adapter, key });

      const beforeSetItemHookHandlerArgs = beforeSetItemHookHandler.mock.calls[0]?.[0];
      expect(beforeSetItemHookHandler).toHaveBeenCalled();
      expect(beforeSetItemHookHandlerArgs).toEqual({ adapter, key: "buildKey-key", value, extra });

      expect(adapter.setItem).toHaveBeenCalledWith("beforeSetItem-key", "beforeSetItem-value", {
        beforeSetItem: "extra",
      });

      const afterSetItemHookHandlerArgs = afterSetItemHookHandler.mock.calls[0]?.[0];
      expect(afterSetItemHookHandler).toHaveBeenCalled();
      expect(afterSetItemHookHandlerArgs).toEqual({
        adapter,
        key: "beforeSetItem-key",
        value: "beforeSetItem-value",
        extra: { beforeSetItem: "extra" },
        item,
      });

      expect(itemSet).toEqual({
        key: "afterSetItem-key",
        value: "afterSetItem-value",
        extra: { afterSetItem: "extra" },
      });
    });
  });

  describe("getItem method", () => {
    it("should get an item using the adapter and return it", async () => {
      const adapter = createDummyAdapter();
      const stashIt = new StashIt(adapter);

      const item = await stashIt.getItem(key);

      expect(adapter.getItem).toHaveBeenCalledWith(key);
      expect(item).toEqual({ key, value, extra });
    });

    describe("when the item for given key does not exist", () => {
      it("should return undefined", async () => {
        const adapter = createDummyAdapter();
        adapter.getItem.mockResolvedValue(undefined);
        const stashIt = new StashIt(adapter);

        const item = await stashIt.getItem("non-existing-item-key");

        expect(item).toBeUndefined();
      });
    });

    it("should connect to the storage, perform the action on the adapter, and disconnect afterwards", async () => {
      const adapter = createDummyAdapter();
      const stashIt = new StashIt(adapter);

      await stashIt.getItem(key);

      expect(adapter.connect).toHaveBeenCalledBefore(adapter.getItem);
      expect(adapter.getItem).toHaveBeenCalledBefore(adapter.disconnect);
      expect(adapter.disconnect).toHaveBeenCalledAfter(adapter.getItem);
    });

    describe("error handling", () => {
      describe("when one of the hook handlers throws", () => {
        it("adapter disconnects, and error is rethrown", () => {
          const plugin: StashItPlugin = {
            hookHandlers: {
              afterGetItem: () => {
                throw new Error("Something went wrong...");
              },
            },
          };

          const adapter = createDummyAdapter();
          const stashIt = new StashIt(adapter);
          stashIt.registerPlugins([plugin]);

          stashIt.getItem("any_key").catch((error) => {
            expect(error.message).toEqual("Something went wrong...");
            expect(adapter.disconnect).toHaveBeenCalled();
            expect(adapter.disconnect).toHaveBeenCalledAfter(adapter.getItem);
          });
        });
      });
    });

    it("flow of data through hooks", async () => {
      const buildKeyHookHandler = vi.fn().mockResolvedValueOnce({ key: "buildKey-key" });
      const beforeGetItemHookHandler = vi.fn().mockResolvedValueOnce({ key: "beforeGetItem-key" });
      const afterGetItemHookHandler = vi.fn().mockResolvedValueOnce({
        key: "afterGetItem-key",
        item: {
          key: "afterGetItem-key",
          value: "afterGetItem-value",
          extra: { afterGetItem: "extra" },
        },
      });

      const plugin: StashItPlugin = {
        hookHandlers: {
          buildKey: buildKeyHookHandler,
          beforeGetItem: beforeGetItemHookHandler,
          afterGetItem: afterGetItemHookHandler,
        },
      };

      const adapter = createDummyAdapter();
      const stashIt = new StashIt(adapter);
      stashIt.registerPlugins([plugin]);

      const itemGot = await stashIt.getItem(key);

      // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
      // as vitest internals want to do something with adapter, and it being frozen, throws an error.
      // That way, it doesn't.
      const buildKeyHookHandlerArgs = buildKeyHookHandler.mock.calls[0]?.[0];
      expect(buildKeyHookHandler).toHaveBeenCalled();
      expect(buildKeyHookHandlerArgs).toEqual({ adapter, key });

      const beforeGetItemHookHandlerArgs = beforeGetItemHookHandler.mock.calls[0]?.[0];
      expect(beforeGetItemHookHandler).toHaveBeenCalled();
      expect(beforeGetItemHookHandlerArgs).toEqual({ adapter, key: "buildKey-key" });

      expect(adapter.getItem).toHaveBeenCalledWith("beforeGetItem-key");

      const afterGetItemHookHandlerArgs = afterGetItemHookHandler.mock.calls[0]?.[0];
      expect(afterGetItemHookHandler).toHaveBeenCalled();
      expect(afterGetItemHookHandlerArgs).toEqual({
        adapter,
        key: "beforeGetItem-key",
        item,
      });

      expect(itemGot).toEqual({
        key: "afterGetItem-key",
        value: "afterGetItem-value",
        extra: { afterGetItem: "extra" },
      });
    });
  });

  describe("hasItem method", () => {
    it("should check if item exists using the adapter", async () => {
      const adapter = createDummyAdapter();
      const stashIt = new StashIt(adapter);

      await stashIt.hasItem(key);

      expect(adapter.hasItem).toHaveBeenCalledWith(key);
    });

    describe("when an item exists for given key", () => {
      it("should return true", async () => {
        const adapter = createDummyAdapter();
        adapter.hasItem.mockResolvedValue(true);
        const stashIt = new StashIt(adapter);

        const result = await stashIt.hasItem(key);

        expect(result).toBe(true);
      });
    });

    describe("when an item does not exist for given key", () => {
      it("should return false", async () => {
        const adapter = createDummyAdapter();
        adapter.hasItem.mockResolvedValue(false);
        const stashIt = new StashIt(adapter);

        const result = await stashIt.hasItem(key);

        expect(result).toBe(false);
      });
    });

    describe("error handling", () => {
      describe("when one of the hook handlers throws", () => {
        it("adapter disconnects, and error is rethrown", () => {
          const plugin: StashItPlugin = {
            hookHandlers: {
              afterHasItem: () => {
                throw new Error("Something went wrong...");
              },
            },
          };

          const adapter = createDummyAdapter();
          const stashIt = new StashIt(adapter);
          stashIt.registerPlugins([plugin]);

          stashIt.hasItem("any_key").catch((error) => {
            expect(error.message).toEqual("Something went wrong...");
            expect(adapter.disconnect).toHaveBeenCalled();
            expect(adapter.disconnect).toHaveBeenCalledAfter(adapter.hasItem);
          });
        });
      });
    });

    it("should connect to the storage, perform the action on the adapter, and disconnect afterwards", async () => {
      const adapter = createDummyAdapter();
      const stashIt = new StashIt(adapter);

      await stashIt.hasItem(key);

      expect(adapter.connect).toHaveBeenCalledBefore(adapter.hasItem);
      expect(adapter.hasItem).toHaveBeenCalledBefore(adapter.disconnect);
      expect(adapter.disconnect).toHaveBeenCalledAfter(adapter.hasItem);
    });

    it("flow of data through hooks", async () => {
      const buildKeyHookHandler = vi.fn().mockResolvedValueOnce({ key: "buildKey-key" });
      const beforeHasItemHookHandler = vi.fn().mockResolvedValueOnce({ key: "beforeHasItem-key" });
      const afterHasItemHookHandler = vi.fn().mockResolvedValueOnce({
        key: "afterHasItem-key",
        result: false,
      });

      const plugin: StashItPlugin = {
        hookHandlers: {
          buildKey: buildKeyHookHandler,
          beforeHasItem: beforeHasItemHookHandler,
          afterHasItem: afterHasItemHookHandler,
        },
      };

      const adapter = createDummyAdapter();
      const stashIt = new StashIt(adapter);
      stashIt.registerPlugins([plugin]);

      const itemSet = await stashIt.hasItem(key);

      // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
      // as vitest internals want to do something with adapter, and it being frozen, throws an error.
      // That way, it doesn't.
      const buildKeyHookHandlerArgs = buildKeyHookHandler.mock.calls[0]?.[0];
      expect(buildKeyHookHandler).toHaveBeenCalled();
      expect(buildKeyHookHandlerArgs).toEqual({ adapter, key });

      const beforeHasItemHookHandlerArgs = beforeHasItemHookHandler.mock.calls[0]?.[0];
      expect(beforeHasItemHookHandler).toHaveBeenCalled();
      expect(beforeHasItemHookHandlerArgs).toEqual({ adapter, key: "buildKey-key" });

      expect(adapter.hasItem).toHaveBeenCalledWith("beforeHasItem-key");

      const afterHasItemHookHandlerArgs = afterHasItemHookHandler.mock.calls[0]?.[0];
      expect(afterHasItemHookHandler).toHaveBeenCalled();
      expect(afterHasItemHookHandlerArgs).toEqual({
        adapter,
        key: "beforeHasItem-key",
        result: true,
      });

      expect(itemSet).toEqual(false);
    });
  });

  describe("removeItem method", () => {
    it("should remove the item using the adapter", async () => {
      const adapter = createDummyAdapter();
      const stashIt = new StashIt(adapter);

      await stashIt.removeItem(key);

      expect(adapter.removeItem).toHaveBeenCalledWith(key);
    });

    describe("when an item exists for given key", () => {
      it("should return true", async () => {
        const adapter = createDummyAdapter();
        adapter.removeItem.mockResolvedValue(true);
        const stashIt = new StashIt(adapter);

        const result = await stashIt.removeItem(key);

        expect(result).toEqual(true);
      });
    });

    describe("when an item does not exist for given key", () => {
      it("should return false", async () => {
        const adapter = createDummyAdapter();
        adapter.removeItem.mockResolvedValue(false);
        const stashIt = new StashIt(adapter);

        const result = await stashIt.removeItem(key);

        expect(result).toEqual(false);
      });
    });

    it("should connect to the storage, perform the action on the adapter, and disconnect afterwards", async () => {
      const adapter = createDummyAdapter();
      const stashIt = new StashIt(adapter);

      await stashIt.removeItem(key);

      expect(adapter.connect).toHaveBeenCalledBefore(adapter.removeItem);
      expect(adapter.removeItem).toHaveBeenCalledBefore(adapter.disconnect);
      expect(adapter.disconnect).toHaveBeenCalledAfter(adapter.removeItem);
    });

    describe("error handling", () => {
      describe("when one of the hook handlers throws", () => {
        it("adapter disconnects, and error is rethrown", () => {
          const plugin: StashItPlugin = {
            hookHandlers: {
              afterRemoveItem: () => {
                throw new Error("Something went wrong...");
              },
            },
          };

          const adapter = createDummyAdapter();
          const stashIt = new StashIt(adapter);
          stashIt.registerPlugins([plugin]);

          stashIt.removeItem("any_key").catch((error) => {
            expect(error.message).toEqual("Something went wrong...");
            expect(adapter.disconnect).toHaveBeenCalled();
            expect(adapter.disconnect).toHaveBeenCalledAfter(adapter.removeItem);
          });
        });
      });
    });

    it("flow of data through hooks", async () => {
      const buildKeyHookHandler = vi.fn().mockResolvedValueOnce({ key: "buildKey-key" });
      const beforeRemoveItemHookHandler = vi.fn().mockResolvedValueOnce({ key: "beforeRemoveItem-key" });
      const afterRemoveItemHookHandler = vi.fn().mockResolvedValueOnce({
        key: "afterRemoveItem-key",
        result: false,
      });

      const plugin: StashItPlugin = {
        hookHandlers: {
          buildKey: buildKeyHookHandler,
          beforeRemoveItem: beforeRemoveItemHookHandler,
          afterRemoveItem: afterRemoveItemHookHandler,
        },
      };

      const adapter = createDummyAdapter();
      const stashIt = new StashIt(adapter);
      stashIt.registerPlugins([plugin]);

      const result = await stashIt.removeItem(key);

      // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
      // as vitest internals want to do something with adapter, and it being frozen, throws an error.
      // That way, it doesn't.
      const buildKeyHookHandlerArgs = buildKeyHookHandler.mock.calls[0]?.[0];
      expect(buildKeyHookHandler).toHaveBeenCalled();
      expect(buildKeyHookHandlerArgs).toEqual({ adapter, key });

      const beforeRemoveItemHookHandlerArgs = beforeRemoveItemHookHandler.mock.calls[0]?.[0];
      expect(beforeRemoveItemHookHandler).toHaveBeenCalled();
      expect(beforeRemoveItemHookHandlerArgs).toEqual({ adapter, key: "buildKey-key" });

      expect(adapter.removeItem).toHaveBeenCalledWith("beforeRemoveItem-key");

      const afterRemoveItemHookHandlerArgs = afterRemoveItemHookHandler.mock.calls[0]?.[0];
      expect(afterRemoveItemHookHandler).toHaveBeenCalled();
      expect(afterRemoveItemHookHandlerArgs).toEqual({
        adapter,
        key: "beforeRemoveItem-key",
        result: true,
      });

      expect(result).toEqual(false);
    });
  });

  describe("setExtra method", () => {
    it("should set extra using the adapter and return it", async () => {
      const adapter = createDummyAdapter();
      const stashIt = new StashIt(adapter);

      const extraSet = await stashIt.setExtra(key, extra);

      expect(adapter.setExtra).toHaveBeenCalledWith(key, extra);
      expect(extraSet).toEqual(extra);
    });

    describe("when an item for given key does not exist", () => {
      it("should return false as the result of setting extra", async () => {
        const adapter = createDummyAdapter();
        adapter.setExtra.mockResolvedValue(false);
        const stashIt = new StashIt(adapter);

        const extraSet = await stashIt.setExtra("non-existing-item-key", extra);

        expect(extraSet).toBe(false);
      });
    });

    it("should connect to the storage, perform the action on the adapter, and disconnect afterwards", async () => {
      const adapter = createDummyAdapter();
      const stashIt = new StashIt(adapter);

      await stashIt.setExtra(key, extra);

      expect(adapter.connect).toHaveBeenCalledBefore(adapter.setExtra);
      expect(adapter.setExtra).toHaveBeenCalledBefore(adapter.disconnect);
      expect(adapter.disconnect).toHaveBeenCalledAfter(adapter.setExtra);
    });

    describe("error handling", () => {
      describe("when one of the hook handlers throws", () => {
        it("adapter disconnects, and error is rethrown", () => {
          const plugin: StashItPlugin = {
            hookHandlers: {
              afterSetExtra: () => {
                throw new Error("Something went wrong...");
              },
            },
          };

          const adapter = createDummyAdapter();
          const stashIt = new StashIt(adapter);
          stashIt.registerPlugins([plugin]);

          stashIt.setExtra("any_key", { some: "extra" }).catch((error) => {
            expect(error.message).toEqual("Something went wrong...");
            expect(adapter.disconnect).toHaveBeenCalled();
            expect(adapter.disconnect).toHaveBeenCalledAfter(adapter.setExtra);
          });
        });
      });
    });

    it("flow of data through hooks", async () => {
      const buildKeyHookHandler = vi.fn().mockResolvedValueOnce({ key: "buildKey-key" });
      const beforeSetExtraHookHandler = vi
        .fn()
        .mockResolvedValueOnce({ key: "beforeSetExtra-key", extra: { beforeSetExtra: "extra" } });
      const afterSetExtraHookHandler = vi.fn().mockResolvedValueOnce({
        key: "afterSetExtra-key",
        extra: { afterSetExtra: "extra" },
      });

      const plugin: StashItPlugin = {
        hookHandlers: {
          buildKey: buildKeyHookHandler,
          beforeSetExtra: beforeSetExtraHookHandler,
          afterSetExtra: afterSetExtraHookHandler,
        },
      };

      const adapter = createDummyAdapter();
      const stashIt = new StashIt(adapter);
      stashIt.registerPlugins([plugin]);

      const extraSet = await stashIt.setExtra(key, extra);

      // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
      // as vitest internals want to do something with adapter, and it being frozen, throws an error.
      // That way, it doesn't.
      const buildKeyHookHandlerArgs = buildKeyHookHandler.mock.calls[0]?.[0];
      expect(buildKeyHookHandler).toHaveBeenCalled();
      expect(buildKeyHookHandlerArgs).toEqual({ adapter, key });

      const beforeSetExtraHookHandlerArgs = beforeSetExtraHookHandler.mock.calls[0]?.[0];
      expect(beforeSetExtraHookHandler).toHaveBeenCalled();
      expect(beforeSetExtraHookHandlerArgs).toEqual({ adapter, key: "buildKey-key", extra });

      expect(adapter.setExtra).toHaveBeenCalledWith("beforeSetExtra-key", { beforeSetExtra: "extra" });

      const afterSetExtraHookHandlerArgs = afterSetExtraHookHandler.mock.calls[0]?.[0];
      expect(afterSetExtraHookHandler).toHaveBeenCalled();
      expect(afterSetExtraHookHandlerArgs).toEqual({
        adapter,
        key: "beforeSetExtra-key",
        extra,
      });

      expect(extraSet).toEqual({ afterSetExtra: "extra" });
    });
  });

  describe("getExtra method", () => {
    it("should get the extra using the adapter and return it", async () => {
      const adapter = createDummyAdapter();
      const stashIt = new StashIt(adapter);

      const extraRetrieved = await stashIt.getExtra(key);

      expect(adapter.getExtra).toHaveBeenCalledWith(key);
      expect(extraRetrieved).toEqual(extra);
    });

    describe("when an item for given key does not exist", () => {
      it("should return undefined", async () => {
        const adapter = createDummyAdapter();
        adapter.getExtra.mockResolvedValue(undefined);
        const stashIt = new StashIt(adapter);

        const extraRetrieved = await stashIt.getExtra(key);

        expect(extraRetrieved).toBeUndefined();
      });
    });

    it("should connect to the storage, perform the action on the adapter, and disconnect afterwards", async () => {
      const adapter = createDummyAdapter();
      const stashIt = new StashIt(adapter);

      await stashIt.getExtra(key);

      expect(adapter.connect).toHaveBeenCalledBefore(adapter.getExtra);
      expect(adapter.getExtra).toHaveBeenCalledBefore(adapter.disconnect);
      expect(adapter.disconnect).toHaveBeenCalledAfter(adapter.getExtra);
    });

    describe("error handling", () => {
      describe("when one of the hook handlers throws", () => {
        it("adapter disconnects, and error is rethrown", () => {
          const plugin: StashItPlugin = {
            hookHandlers: {
              afterGetExtra: () => {
                throw new Error("Something went wrong...");
              },
            },
          };

          const adapter = createDummyAdapter();
          const stashIt = new StashIt(adapter);
          stashIt.registerPlugins([plugin]);

          stashIt.getExtra("any_key").catch((error) => {
            expect(error.message).toEqual("Something went wrong...");
            expect(adapter.disconnect).toHaveBeenCalled();
            expect(adapter.disconnect).toHaveBeenCalledAfter(adapter.getExtra);
          });
        });
      });
    });

    it("flow of data through hooks", async () => {
      const buildKeyHookHandler = vi.fn().mockResolvedValueOnce({ key: "buildKey-key" });
      const beforeGetExtraHookHandler = vi.fn().mockResolvedValueOnce({ key: "beforeGetExtra-key" });
      const afterGetExtraHookHandler = vi
        .fn()
        .mockResolvedValueOnce({ key: "afterGetExtra-key", extra: { afterGetExtra: "extra" } });

      const plugin: StashItPlugin = {
        hookHandlers: {
          buildKey: buildKeyHookHandler,
          beforeGetExtra: beforeGetExtraHookHandler,
          afterGetExtra: afterGetExtraHookHandler,
        },
      };

      const adapter = createDummyAdapter();
      const stashIt = new StashIt(adapter);
      stashIt.registerPlugins([plugin]);

      const extraGot = await stashIt.getExtra(key);

      // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
      // as vitest internals want to do something with adapter, and it being frozen, throws an error.
      // That way, it doesn't.
      const buildKeyHookHandlerArgs = buildKeyHookHandler.mock.calls[0]?.[0];
      expect(buildKeyHookHandler).toHaveBeenCalled();
      expect(buildKeyHookHandlerArgs).toEqual({ adapter, key });

      const beforeGetExtraHookHandlerArgs = beforeGetExtraHookHandler.mock.calls[0]?.[0];
      expect(beforeGetExtraHookHandler).toHaveBeenCalled();
      expect(beforeGetExtraHookHandlerArgs).toEqual({ adapter, key: "buildKey-key" });

      expect(adapter.getExtra).toHaveBeenCalledWith("beforeGetExtra-key");

      const afterGetExtraHookHandlerArgs = afterGetExtraHookHandler.mock.calls[0]?.[0];
      expect(afterGetExtraHookHandler).toHaveBeenCalled();
      expect(afterGetExtraHookHandlerArgs).toEqual({
        adapter,
        key: "beforeGetExtra-key",
        extra,
      });

      expect(extraGot).toEqual({ afterGetExtra: "extra" });
    });
  });

  describe("registerPlugins method", () => {
    // Each hook is tested in its own test suite.
    // Testing general use for the method.
    describe("when more than one plugin is registered for a given hook", () => {
      it("should call all hook handlers for that hook in the order they were registered", async () => {
        const HookHandler1 = vi.fn();
        const HookHandler2 = vi.fn();
        const plugin1: StashItPlugin = {
          hookHandlers: {
            beforeSetItem: HookHandler1,
          },
        };
        const plugin2: StashItPlugin = {
          hookHandlers: {
            beforeSetItem: HookHandler2,
          },
        };

        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin1, plugin2]);

        await stashIt.setItem(key, value, extra);

        expect(HookHandler1).toHaveBeenCalledBefore(HookHandler2);
      });
    });
  });
});

const createDummyAdapter = () => {
  const dummyAdapter = mock<StashItAdapterInterface>();

  dummyAdapter.connect.mockResolvedValue(undefined);
  dummyAdapter.disconnect.mockResolvedValue(undefined);
  dummyAdapter.checkStorage.mockResolvedValue(true);
  dummyAdapter.setItem.mockResolvedValue(item);
  dummyAdapter.getItem.mockResolvedValue(item);
  dummyAdapter.hasItem.mockResolvedValue(true);
  dummyAdapter.removeItem.mockResolvedValue(true);
  dummyAdapter.setExtra.mockResolvedValue(extra);
  dummyAdapter.getExtra.mockResolvedValue(extra);

  return dummyAdapter;
};
