import { describe, expect, it, vi } from "vitest";
import { toHaveBeenCalledBefore } from "jest-extended";
import { StashItAdapter, type StashItPlugin } from "@stash-it/core";
import { mock } from "vitest-mock-extended";
import { StashIt } from "./index";

expect.extend({ toHaveBeenCalledBefore });

const key = "key";
const value = "value";
const extra = { foo: "bar" };
const item = { key, value, extra };

describe("stash-it class", () => {
  describe("because adapter is passed to hook handlers", () => {
    it("should not be possible to alter it (plugins could try to do it)", () => {
      expect(async () => {
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeSetItem: async (args) => {
              // @ts-ignore
              args.adapter.getItem = null;

              return args;
            },
          },
        };

        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.setItem(key, value, extra);
      }).rejects.toThrowErrorMatchingSnapshot();
    });
  });

  describe("buildKey hook", () => {
    describe("when a hook handler is registered for buildKey hook", () => {
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

    describe("when a hook handler is registered for beforeSetItem hook", () => {
      it("should call that hook handler with arguments passed to the setItem method", async () => {
        const beforeSetItemHookHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeSetItem: beforeSetItemHookHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.setItem(key, value, extra);

        // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
        // as vitest internals want to do something with adapter, and it being frozen, throws an error.
        // That way, it doesn't.
        expect(beforeSetItemHookHandler).toHaveBeenCalled();

        const args = beforeSetItemHookHandler.mock.calls[0]?.[0];
        expect(args).toEqual({ adapter, key, value, extra });
      });

      it("adapter's setItem method is called with arguments returned from beforeSetItem hook handler", async () => {
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeSetItem: () => Promise.resolve({ key: "new-key", value: "new-value", extra: { new: "extra" } }),
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.setItem(key, value, extra);

        expect(adapter.setItem).toHaveBeenCalledWith("new-key", "new-value", { new: "extra" });
      });
    });

    describe("when a hook handler is registered for afterSetItem hook", () => {
      it("should call that handler with the arguments passed to the setItem method, built key and item set by the adapter", async () => {
        // In order to verify that the result of building the key is passed to "after..." hook, I need to
        // make sure a value from building the key is used, and not the value of "key" argument passed.
        const buildKeyHookHandler = vi
          .fn()
          .mockImplementationOnce((args) => Promise.resolve({ ...args, key: `${args.key}_built-key` }));

        const afterSetItemHookHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            buildKey: buildKeyHookHandler,
            afterSetItem: afterSetItemHookHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.setItem(key, value, extra);

        // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
        // as vitest internals want to do something with adapter, and it being frozen, throws an error.
        // That way, it doesn't.
        expect(afterSetItemHookHandler).toHaveBeenCalled();

        const args = afterSetItemHookHandler.mock.calls[0]?.[0];

        expect(args).toEqual({ adapter, key: "key_built-key", value, extra, item });
      });

      it("returned value is the one coming from afterSetItem hook handler", async () => {
        const plugin: StashItPlugin = {
          hookHandlers: {
            afterSetItem: () =>
              Promise.resolve({
                key: "new-key",
                value: "new-value",
                extra: { new: "extra" },
                item: { key: "new-key", value: "new-value", extra: { new: "extra" } },
              }),
          },
        };
        const adapter = createDummyAdapter();
        adapter.setItem.mockResolvedValue(item);

        const stashIt = new StashIt(adapter);
        stashIt.registerPlugins([plugin]);

        const itemSet = await stashIt.setItem(key, value, extra);

        expect(itemSet).toEqual({ key: "new-key", value: "new-value", extra: { new: "extra" } });
      });
    });

    describe("when hook handlers are set for both beforeSetItem and afterSetItem hooks", () => {
      it("should call afterSetItem hook handler with arguments returned from beforeSetItem hook handler and built key", async () => {
        // In order to verify that the result of building the key is passed to "after..." hook, I need to
        // make sure a value from building the key is used, and not the value of "key" argument passed.
        const buildKeyHookHandler = vi
          .fn()
          .mockImplementationOnce((args) => Promise.resolve({ ...args, key: `${args.key}_built-key` }));

        const afterSetItemHookHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            buildKey: buildKeyHookHandler,
            beforeSetItem: () =>
              Promise.resolve({ adapter, key: "new-key", value: "new-value", extra: { new: "extra" } }),
            afterSetItem: afterSetItemHookHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.setItem.mockResolvedValue(item);

        const stashIt = new StashIt(adapter);
        stashIt.registerPlugins([plugin]);

        await stashIt.setItem(key, value, extra);

        // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
        // as vitest internals want to do something with adapter, and it being frozen, throws an error.
        // That way, it doesn't.
        expect(afterSetItemHookHandler).toHaveBeenCalled();

        const args = afterSetItemHookHandler.mock.calls[0]?.[0];
        expect(args).toEqual({ adapter, key: "new-key_built-key", value: "new-value", extra: { new: "extra" }, item });
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

    describe("when a hook handler is registered for beforeGetItem hook", () => {
      it("should call that hook handler with arguments passed to the getItem method", async () => {
        const beforeGetItemHookHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeGetItem: beforeGetItemHookHandler,
            // beforeGetItem: spy,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.getItem(key);

        // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
        // as vitest internals want to do something with adapter, and it being frozen, throws an error.
        // That way, it doesn't.
        expect(beforeGetItemHookHandler).toHaveBeenCalled();

        const args = beforeGetItemHookHandler.mock.calls[0]?.[0];
        expect(args).toEqual({ adapter, key });
      });

      it("adapter's getItem method is called with arguments returned from beforeGetItem hook handler", async () => {
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeGetItem: () => Promise.resolve({ key: "new-key" }),
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.getItem(key);

        expect(adapter.getItem).toHaveBeenCalledWith("new-key");
      });
    });

    describe("when a hook handler is registered for afterGetItem hook", () => {
      it("should call that hook handler with the arguments passed to the getItem method, built key and retrieved item", async () => {
        // In order to verify that the result of building the key is passed to "after..." hook, I need to
        // make sure a value from building the key is used, and not the value of "key" argument passed.
        const buildKeyHookHandler = vi
          .fn()
          .mockImplementationOnce((args) => Promise.resolve({ ...args, key: `${args.key}_built-key` }));

        const afterGetItemHookHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            buildKey: buildKeyHookHandler,
            afterGetItem: afterGetItemHookHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.getItem(key);

        // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
        // as vitest internals want to do something with adapter, and it being frozen, throws an error.
        // That way, it doesn't.
        expect(afterGetItemHookHandler).toHaveBeenCalled();

        const args = afterGetItemHookHandler.mock.calls[0]?.[0];
        expect(args).toEqual({ adapter, key: "key_built-key", item: { key, value, extra } });
      });

      it("returned value is the one coming from afterGetItem hook handler", async () => {
        const plugin: StashItPlugin = {
          hookHandlers: {
            afterGetItem: () =>
              Promise.resolve({
                key: "new-key",
                item: { key: "new-key", value: "new-value", extra: { new: "extra" } },
              }),
          },
        };
        const adapter = createDummyAdapter();
        adapter.getItem.mockResolvedValue({ key, value, extra });
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        const item = await stashIt.getItem(key);

        expect(item).toEqual({ key: "new-key", value: "new-value", extra: { new: "extra" } });
      });
    });

    describe("when hook handlers are set for both beforeGetItem and afterGetItem hooks", () => {
      it("should call afterGetItem hook handler with arguments returned from beforeGetItem hook handler and built key", async () => {
        // In order to verify that the result of building the key is passed to "after..." hook, I need to
        // make sure a value from building the key is used, and not the value of "key" argument passed.
        const buildKeyHookHandler = vi
          .fn()
          .mockImplementationOnce((args) => Promise.resolve({ ...args, key: `${args.key}_built-key` }));

        const afterGetItemHookHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            buildKey: buildKeyHookHandler,
            beforeGetItem: () => Promise.resolve({ key: "new-key" }),
            afterGetItem: afterGetItemHookHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.getItem.mockResolvedValue(item);

        const stashIt = new StashIt(adapter);
        stashIt.registerPlugins([plugin]);

        await stashIt.getItem(key);

        // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
        // as vitest internals want to do something with adapter, and it being frozen, throws an error.
        // That way, it doesn't.
        expect(afterGetItemHookHandler).toHaveBeenCalled();

        const args = afterGetItemHookHandler.mock.calls[0]?.[0];
        expect(args).toEqual({ adapter, key: "new-key_built-key", item });
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

    describe("when a hook handler is registered for beforeHasItem hook", () => {
      it("should call that hook handler with arguments passed to the hasItem method", async () => {
        const beforeHasItemHookHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeHasItem: beforeHasItemHookHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.hasItem(key);

        // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
        // as vitest internals want to do something with adapter, and it being frozen, throws an error.
        // That way, it doesn't.
        expect(beforeHasItemHookHandler).toHaveBeenCalled();

        const args = beforeHasItemHookHandler.mock.calls[0]?.[0];
        expect(args).toEqual({ adapter, key });
      });

      it("adapter's hasItem method is called with arguments returned from beforeHasItem hook handler", async () => {
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeHasItem: () => Promise.resolve({ key: "new-key" }),
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.hasItem(key);

        expect(adapter.hasItem).toHaveBeenCalledWith("new-key");
      });
    });

    describe("when a hook handler is registered for afterHasItem hook", () => {
      it("should call that hook handler with the arguments passed to the hasItem method, built key and result of finding that item", async () => {
        // In order to verify that the result of building the key is passed to "after..." hook, I need to
        // make sure a value from building the key is used, and not the value of "key" argument passed.
        const buildKeyHookHandler = vi
          .fn()
          .mockImplementationOnce((args) => Promise.resolve({ ...args, key: `${args.key}_built-key` }));

        const afterHasItemHookHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            buildKey: buildKeyHookHandler,
            afterHasItem: afterHasItemHookHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.hasItem.mockResolvedValue(true);
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.hasItem(key);

        // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
        // as vitest internals want to do something with adapter, and it being frozen, throws an error.
        // That way, it doesn't.
        expect(afterHasItemHookHandler).toHaveBeenCalled();

        const args = afterHasItemHookHandler.mock.calls[0]?.[0];
        expect(args).toEqual({ adapter, key: "key_built-key", result: true });
      });

      it("returned value is the one coming from afterHasItem hook handler", async () => {
        const plugin: StashItPlugin = {
          hookHandlers: {
            afterHasItem: () =>
              Promise.resolve({
                key: "new-key",
                result: false,
              }),
          },
        };
        const adapter = createDummyAdapter();
        adapter.hasItem.mockResolvedValue(true);
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        const result = await stashIt.hasItem(key);

        expect(result).toEqual(false);
      });
    });

    describe("when hook handlers are set for both beforeHasItem and afterHasItem hooks", () => {
      it("should call afterHasItem hook handler with arguments returned from beforeHasItem hook handler and built key", async () => {
        // In order to verify that the result of building the key is passed to "after..." hook, I need to
        // make sure a value from building the key is used, and not the value of "key" argument passed.
        const buildKeyHookHandler = vi
          .fn()
          .mockImplementationOnce((args) => Promise.resolve({ ...args, key: `${args.key}_built-key` }));

        const afterHasItemHookHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            buildKey: buildKeyHookHandler,
            beforeHasItem: () => Promise.resolve({ key: "new-key" }),
            afterHasItem: afterHasItemHookHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.hasItem.mockResolvedValue(true);

        const stashIt = new StashIt(adapter);
        stashIt.registerPlugins([plugin]);

        await stashIt.hasItem(key);

        // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
        // as vitest internals want to do something with adapter, and it being frozen, throws an error.
        // That way, it doesn't.
        expect(afterHasItemHookHandler).toHaveBeenCalled();

        const args = afterHasItemHookHandler.mock.calls[0]?.[0];
        expect(args).toEqual({ adapter, key: "new-key_built-key", result: true });
      });
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

    describe("when a hook handler is registered for beforeRemoveItem hook", () => {
      it("should call that hook handler with arguments passed to the removeItem method", async () => {
        const beforeRemoveItemHookHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeRemoveItem: beforeRemoveItemHookHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.removeItem(key);

        // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
        // as vitest internals want to do something with adapter, and it being frozen, throws an error.
        // That way, it doesn't.
        expect(beforeRemoveItemHookHandler).toHaveBeenCalled();

        const args = beforeRemoveItemHookHandler.mock.calls[0]?.[0];
        expect(args).toEqual({ adapter, key });
      });

      it("adapter's removeItem method is called with arguments returned from beforeRemoveItem hook handler", async () => {
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeRemoveItem: () => Promise.resolve({ key: "new-key" }),
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.removeItem(key);

        expect(adapter.removeItem).toHaveBeenCalledWith("new-key");
      });
    });

    describe("when a hook handler is registered for afterRemoveItem hook", () => {
      it("should call that hook handler with the arguments passed to removeItem method, built key and result of removing that item", async () => {
        // In order to verify that the result of building the key is passed to "after..." hook, I need to
        // make sure a value from building the key is used, and not the value of "key" argument passed.
        const buildKeyHookHandler = vi
          .fn()
          .mockImplementationOnce((args) => Promise.resolve({ ...args, key: `${args.key}_built-key` }));

        const afterRemoveItemHookHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            buildKey: buildKeyHookHandler,
            afterRemoveItem: afterRemoveItemHookHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.removeItem.mockResolvedValue(true);
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.removeItem(key);

        // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
        // as vitest internals want to do something with adapter, and it being frozen, throws an error.
        // That way, it doesn't.
        expect(afterRemoveItemHookHandler).toHaveBeenCalled();

        const args = afterRemoveItemHookHandler.mock.calls[0]?.[0];
        expect(args).toEqual({ adapter, key: "key_built-key", result: true });
      });

      it("returned value is the one coming from afterRemoveItem hook handler", async () => {
        const plugin: StashItPlugin = {
          hookHandlers: {
            afterRemoveItem: () =>
              Promise.resolve({
                key: "new-key",
                result: false,
              }),
          },
        };
        const adapter = createDummyAdapter();
        adapter.removeItem.mockResolvedValue(true);
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        const result = await stashIt.removeItem(key);

        expect(result).toEqual(false);
      });
    });

    describe("when hook handlers are set for both beforeRemoveItem and afterRemoveItem hooks", () => {
      it("should call afterRemoveItem hook handler with arguments returned from beforeRemoveItem hook handler and built key", async () => {
        // In order to verify that the result of building the key is passed to "after..." hook, I need to
        // make sure a value from building the key is used, and not the value of "key" argument passed.
        const buildKeyHookHandler = vi
          .fn()
          .mockImplementationOnce((args) => Promise.resolve({ ...args, key: `${args.key}_built-key` }));

        const afterRemoveItemHookHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            buildKey: buildKeyHookHandler,
            beforeRemoveItem: () => Promise.resolve({ key: "new-key" }),
            afterRemoveItem: afterRemoveItemHookHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.removeItem.mockResolvedValue(true);

        const stashIt = new StashIt(adapter);
        stashIt.registerPlugins([plugin]);

        await stashIt.removeItem(key);

        // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
        // as vitest internals want to do something with adapter, and it being frozen, throws an error.
        // That way, it doesn't.
        expect(afterRemoveItemHookHandler).toHaveBeenCalled();

        const args = afterRemoveItemHookHandler.mock.calls[0]?.[0];
        expect(args).toEqual({ adapter, key: "new-key_built-key", result: true });
      });
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

    describe("when a hook handler is registered for beforeSetExtra hook", () => {
      it("should call that hook handler with arguments passed to the setExtra method", async () => {
        const beforeSetExtraHookHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeSetExtra: beforeSetExtraHookHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.setExtra(key, extra);

        // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
        // as vitest internals want to do something with adapter, and it being frozen, throws an error.
        // That way, it doesn't.
        expect(beforeSetExtraHookHandler).toHaveBeenCalled();

        const args = beforeSetExtraHookHandler.mock.calls[0]?.[0];
        expect(args).toEqual({ adapter, key, extra });
      });

      it("adapter's setExtra method is called with arguments returned from beforeSetExtra hook handler", async () => {
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeSetExtra: () => Promise.resolve({ key: "new-key", extra: { new: "extra" } }),
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.setExtra(key, extra);

        expect(adapter.setExtra).toHaveBeenCalledWith("new-key", { new: "extra" });
      });
    });

    describe("when a hook handler is registered for afterSetExtra hook", () => {
      it("should call that hook handler with the arguments passed to the setExtra method, built key and extra set", async () => {
        // In order to verify that the result of building the key is passed to "after..." hook, I need to
        // make sure a value from building the key is used, and not the value of "key" argument passed.
        const buildKeyHookHandler = vi
          .fn()
          .mockImplementationOnce((args) => Promise.resolve({ ...args, key: `${args.key}_built-key` }));

        const afterSetExtraHookHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            buildKey: buildKeyHookHandler,
            afterSetExtra: afterSetExtraHookHandler,
          },
        };
        const adapter = createDummyAdapter();
        const extraSet = { ...extra };
        adapter.setExtra.mockResolvedValue(extraSet);
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.setExtra(key, extra);

        // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
        // as vitest internals want to do something with adapter, and it being frozen, throws an error.
        // That way, it doesn't.
        expect(afterSetExtraHookHandler).toHaveBeenCalled();

        const args = afterSetExtraHookHandler.mock.calls[0]?.[0];
        expect(args).toEqual({ adapter, key: "key_built-key", extra });
      });

      it("returned value is the one coming from afterSetExtra hook handler", async () => {
        const plugin: StashItPlugin = {
          hookHandlers: {
            afterSetExtra: () =>
              Promise.resolve({
                key: "new-key",
                extra: { new: "extra" },
              }),
          },
        };
        const adapter = createDummyAdapter();
        adapter.setExtra.mockResolvedValue(extra);
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        const result = await stashIt.setExtra(key, extra);

        expect(result).toEqual({ new: "extra" });
      });
    });

    describe("when hook handlers are set for both beforeSetExtra and afterSetExtra hooks", () => {
      it("should call afterSetExtra hook handler with arguments returned from beforeSetExtra hook handler and built key", async () => {
        // In order to verify that the result of building the key is passed to "after..." hook, I need to
        // make sure a value from building the key is used, and not the value of "key" argument passed.
        const buildKeyHookHandler = vi
          .fn()
          .mockImplementationOnce((args) => Promise.resolve({ ...args, key: `${args.key}_built-key` }));

        const afterSetExtraHookHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            buildKey: buildKeyHookHandler,
            beforeSetExtra: () => Promise.resolve({ key: "new-key", extra: { new: "extra" } }),
            afterSetExtra: afterSetExtraHookHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.setExtra.mockResolvedValue(extra);

        const stashIt = new StashIt(adapter);
        stashIt.registerPlugins([plugin]);

        await stashIt.setExtra(key, extra);

        // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
        // as vitest internals want to do something with adapter, and it being frozen, throws an error.
        // That way, it doesn't.
        expect(afterSetExtraHookHandler).toHaveBeenCalled();

        const args = afterSetExtraHookHandler.mock.calls[0]?.[0];
        expect(args).toEqual({ adapter, key: "new-key_built-key", extra });
      });
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

    describe("when a hook handler is registered for beforeGetExtra hook", () => {
      it("should call that hook handler with arguments passed to the getExtra method", async () => {
        const beforeGetExtraHookHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeGetExtra: beforeGetExtraHookHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.getExtra(key);

        // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
        // as vitest internals want to do something with adapter, and it being frozen, throws an error.
        // That way, it doesn't.
        expect(beforeGetExtraHookHandler).toHaveBeenCalled();

        const args = beforeGetExtraHookHandler.mock.calls[0]?.[0];
        expect(args).toEqual({ adapter, key });
      });

      it("adapter's getExtra method is called with arguments returned from beforeGetExtra hook handler", async () => {
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeGetExtra: () => Promise.resolve({ key: "new-key" }),
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.getExtra(key);

        expect(adapter.getExtra).toHaveBeenCalledWith("new-key");
      });
    });

    describe("when a hook handler is registered for afterGetExtra hook", () => {
      it("should call that hook handler with the arguments passed to the getExtra method, built key and extra retrieved", async () => {
        // In order to verify that the result of building the key is passed to "after..." hook, I need to
        // make sure a value from building the key is used, and not the value of "key" argument passed.
        const buildKeyHookHandler = vi
          .fn()
          .mockImplementationOnce((args) => Promise.resolve({ ...args, key: `${args.key}_built-key` }));

        const afterGetExtraHookHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            buildKey: buildKeyHookHandler,
            afterGetExtra: afterGetExtraHookHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.getExtra(key);

        // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
        // as vitest internals want to do something with adapter, and it being frozen, throws an error.
        // That way, it doesn't.
        expect(afterGetExtraHookHandler).toHaveBeenCalled();

        const args = afterGetExtraHookHandler.mock.calls[0]?.[0];
        expect(args).toEqual({ adapter, key: "key_built-key", extra });
      });

      it("returned value is the one coming from afterGetExtra hook handler", async () => {
        const plugin: StashItPlugin = {
          hookHandlers: {
            afterGetExtra: () =>
              Promise.resolve({
                key: "new-key",
                extra: { new: "extra" },
              }),
          },
        };
        const adapter = createDummyAdapter();
        adapter.getExtra.mockResolvedValue(extra);
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        const result = await stashIt.getExtra(key);

        expect(result).toEqual({ new: "extra" });
      });
    });

    describe("when hook handlers are set for both beforeGetExtra and afterGetExtra hooks", () => {
      it("should call afterGetExtra hook handler with arguments returned from beforeGetExtra hook handler and built key", async () => {
        // In order to verify that the result of building the key is passed to "after..." hook, I need to
        // make sure a value from building the key is used, and not the value of "key" argument passed.
        const buildKeyHookHandler = vi
          .fn()
          .mockImplementationOnce((args) => Promise.resolve({ ...args, key: `${args.key}_built-key` }));

        const afterGetExtraHookHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            buildKey: buildKeyHookHandler,
            beforeGetExtra: () => Promise.resolve({ key: "new-key", extra: { new: "extra" } }),
            afterGetExtra: afterGetExtraHookHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.getExtra.mockResolvedValue(extra);

        const stashIt = new StashIt(adapter);
        stashIt.registerPlugins([plugin]);

        await stashIt.getExtra(key);

        // I need to check the arguments passed to the hook handler instead of doing toHaveBeenCalledWith,
        // as vitest internals want to do something with adapter, and it being frozen, throws an error.
        // That way, it doesn't.
        expect(afterGetExtraHookHandler).toHaveBeenCalled();

        const args = afterGetExtraHookHandler.mock.calls[0]?.[0];
        expect(args).toEqual({ adapter, key: "new-key_built-key", extra });
      });
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
  const dummyAdapter = mock<StashItAdapter>();

  dummyAdapter.connect.mockResolvedValue(undefined);
  dummyAdapter.disconnect.mockResolvedValue(undefined);
  dummyAdapter.setItem.mockResolvedValue(item);
  dummyAdapter.getItem.mockResolvedValue(item);
  dummyAdapter.hasItem.mockResolvedValue(true);
  dummyAdapter.removeItem.mockResolvedValue(true);
  dummyAdapter.setExtra.mockResolvedValue(extra);
  dummyAdapter.getExtra.mockResolvedValue(extra);

  return dummyAdapter;
};
