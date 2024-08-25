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
  describe("buildKey hook", () => {
    describe("when an event handler is registered for buildKey hook", () => {
      it("should be used to build the key", async () => {
        const buildKeyEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            buildKey: buildKeyEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.setItem(key, value, extra);

        expect(buildKeyEventHandler).toHaveBeenCalledWith({ adapter, key });
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

    describe("when an event handler is registered for beforeSetItem hook", () => {
      it("should call that event handler with arguments passed to the setItem method", async () => {
        const beforeSetItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeSetItem: beforeSetItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.setItem(key, value, extra);

        expect(beforeSetItemEventHandler).toHaveBeenCalledWith({ adapter, key, value, extra });
      });

      it("adapter's setItem method is called with arguments returned from beforeSetItem event handler", async () => {
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

    describe("when an event handler is registered for afterSetItem hook", () => {
      it("should call that handler with the arguments passed to the setItem method and item set by the adapter", async () => {
        const afterSetItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            afterSetItem: afterSetItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.setItem(key, value, extra);

        expect(afterSetItemEventHandler).toHaveBeenCalledWith({ adapter, key, value, extra, item });
      });

      it("returned value is the one coming from afterSetItem event handler", async () => {
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

    describe("when event handlers are set for both beforeSetItem and afterSetItem hooks", () => {
      it("should call afterSetItem event handler with arguments returned from beforeSetItem event handler", async () => {
        const afterSetItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeSetItem: () => Promise.resolve({ key: "new-key", value: "new-value", extra: { new: "extra" } }),
            afterSetItem: afterSetItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.setItem.mockResolvedValue(item);

        const stashIt = new StashIt(adapter);
        stashIt.registerPlugins([plugin]);

        await stashIt.setItem(key, value, extra);

        expect(afterSetItemEventHandler).toHaveBeenCalledWith({
          adapter,
          key: "new-key",
          value: "new-value",
          extra: { new: "extra" },
          item,
        });
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

    describe("when an event handler is registered for beforeGetItem hook", () => {
      it("should call that event handler with arguments passed to the getItem method", async () => {
        const beforeGetItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeGetItem: beforeGetItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.getItem(key);

        expect(beforeGetItemEventHandler).toHaveBeenCalledWith({ adapter, key });
      });

      it("adapter's getItem method is called with arguments returned from beforeGetItem event handler", async () => {
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

    describe("when an event handler is registered for afterGetItem hook", () => {
      it("should call that event handler with the arguments passed to the getItem method and retrieved item", async () => {
        const afterGetItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            afterGetItem: afterGetItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.getItem(key);

        expect(afterGetItemEventHandler).toHaveBeenCalledWith({ adapter, key, item: { key, value, extra } });
      });

      it("returned value is the one coming from afterGetItem event handler", async () => {
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

    describe("when event handlers are set for both beforeGetItem and afterGetItem hooks", () => {
      it("should call afterGetItem event handler with arguments returned from beforeGetItem event handler", async () => {
        const afterGetItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeGetItem: () => Promise.resolve({ key: "new-key" }),
            afterGetItem: afterGetItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.getItem.mockResolvedValue(item);

        const stashIt = new StashIt(adapter);
        stashIt.registerPlugins([plugin]);

        await stashIt.getItem(key);

        expect(afterGetItemEventHandler).toHaveBeenCalledWith({ adapter, key: "new-key", item });
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

    describe("when an event handler is registered for beforeHasItem hook", () => {
      it("should call that event handler with arguments passed to the hasItem method", async () => {
        const beforeHasItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeHasItem: beforeHasItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.hasItem(key);

        expect(beforeHasItemEventHandler).toHaveBeenCalledWith({ adapter, key });
      });

      it("adapter's hasItem method is called with arguments returned from beforeHasItem event handler", async () => {
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

    describe("when an event handler is registered for afterHasItem hook", () => {
      it("should call that event handler with the arguments passed to the hasItem method and result of finding that item", async () => {
        const afterHasItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            afterHasItem: afterHasItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.hasItem.mockResolvedValue(true);
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.hasItem(key);

        expect(afterHasItemEventHandler).toHaveBeenCalledWith({ adapter, key, result: true });
      });

      it("returned value is the one coming from afterHasItem event handler", async () => {
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

    describe("when event handlers are set for both beforeHasItem and afterHasItem hooks", () => {
      it("should call afterHasItem event handler with arguments returned from beforeHasItem event handler", async () => {
        const afterHasItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeHasItem: () => Promise.resolve({ key: "new-key" }),
            afterHasItem: afterHasItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.hasItem.mockResolvedValue(true);

        const stashIt = new StashIt(adapter);
        stashIt.registerPlugins([plugin]);

        await stashIt.hasItem(key);

        expect(afterHasItemEventHandler).toHaveBeenCalledWith({ adapter, key: "new-key", result: true });
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

    describe("when an event handler is registered for beforeRemoveItem hook", () => {
      it("should call that event handler with arguments passed to the removeItem method", async () => {
        const beforeRemoveItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeRemoveItem: beforeRemoveItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.removeItem(key);

        expect(beforeRemoveItemEventHandler).toHaveBeenCalledWith({ adapter, key });
      });

      it("adapter's removeItem method is called with arguments returned from beforeRemoveItem event handler", async () => {
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

    describe("when an event handler is registered for afterRemoveItem hook", () => {
      it("should call that event handler with the arguments passed to removeItem method and result of removing that item", async () => {
        const afterRemoveItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            afterRemoveItem: afterRemoveItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.removeItem.mockResolvedValue(true);
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.removeItem(key);

        expect(afterRemoveItemEventHandler).toHaveBeenCalledWith({ adapter, key, result: true });
      });

      it("returned value is the one coming from afterRemoveItem event handler", async () => {
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

    describe("when event handlers are set for both beforeRemoveItem and afterRemoveItem hooks", () => {
      it("should call afterRemoveItem event handler with arguments returned from beforeRemoveItem event handler", async () => {
        const afterRemoveItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeRemoveItem: () => Promise.resolve({ key: "new-key" }),
            afterRemoveItem: afterRemoveItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.removeItem.mockResolvedValue(true);

        const stashIt = new StashIt(adapter);
        stashIt.registerPlugins([plugin]);

        await stashIt.removeItem(key);

        expect(afterRemoveItemEventHandler).toHaveBeenCalledWith({ adapter, key: "new-key", result: true });
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

    describe("when an event handler is registered for beforeSetExtra hook", () => {
      it("should call that event handler with arguments passed to the setExtra method", async () => {
        const beforeSetExtraEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeSetExtra: beforeSetExtraEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.setExtra(key, extra);

        expect(beforeSetExtraEventHandler).toHaveBeenCalledWith({ adapter, key, extra });
      });

      it("adapter's setExtra method is called with arguments returned from beforeSetExtra event handler", async () => {
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

    describe("when an event handler is registered for afterSetExtra hook", () => {
      it("should call that event handler with the arguments passed to the setExtra method and extra set", async () => {
        const afterSetExtraEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            afterSetExtra: afterSetExtraEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const extraSet = { ...extra };
        adapter.setExtra.mockResolvedValue(extraSet);
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.setExtra(key, extra);

        expect(afterSetExtraEventHandler).toHaveBeenCalledWith({ adapter, key, extra });
      });

      it("returned value is the one coming from afterSetExtra event handler", async () => {
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

    describe("when event handlers are set for both beforeSetExtra and afterSetExtra hooks", () => {
      it("should call afterSetExtra event handler with arguments returned from beforeSetExtra event handler", async () => {
        const afterSetExtraEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeSetExtra: () => Promise.resolve({ key: "new-key", extra: { new: "extra" } }),
            afterSetExtra: afterSetExtraEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.setExtra.mockResolvedValue(extra);

        const stashIt = new StashIt(adapter);
        stashIt.registerPlugins([plugin]);

        await stashIt.setExtra(key, extra);

        expect(afterSetExtraEventHandler).toHaveBeenCalledWith({ adapter, key: "new-key", extra });
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

    describe("when an event handler is registered for beforeGetExtra hook", () => {
      it("should call that event handler with arguments passed to the getExtra method", async () => {
        const beforeGetExtraEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeGetExtra: beforeGetExtraEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.getExtra(key);

        expect(beforeGetExtraEventHandler).toHaveBeenCalledWith({ adapter, key });
      });

      it("adapter's getExtra method is called with arguments returned from beforeGetExtra event handler", async () => {
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

    describe("when an event handler is registered for afterGetExtra hook", () => {
      it("should call that event handler with the arguments passed to the getExtra method and extra retrieved", async () => {
        const afterGetExtraEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            afterGetExtra: afterGetExtraEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.getExtra(key);

        expect(afterGetExtraEventHandler).toHaveBeenCalledWith({ adapter, key, extra });
      });

      it("returned value is the one coming from afterGetExtra event handler", async () => {
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

    describe("when event handlers are set for both beforeGetExtra and afterGetExtra hooks", () => {
      it("should call afterGetExtra event handler with arguments returned from beforeGetExtra event handler", async () => {
        const afterGetExtraEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: StashItPlugin = {
          hookHandlers: {
            beforeGetExtra: () => Promise.resolve({ key: "new-key", extra: { new: "extra" } }),
            afterGetExtra: afterGetExtraEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.getExtra.mockResolvedValue(extra);

        const stashIt = new StashIt(adapter);
        stashIt.registerPlugins([plugin]);

        await stashIt.getExtra(key);

        expect(afterGetExtraEventHandler).toHaveBeenCalledWith({ adapter, key: "new-key", extra });
      });
    });
  });

  describe("registerPlugins method", () => {
    // Each hook is tested in its own test suite.
    // Testing general use for the method.
    describe("when more than one plugin is registered for a given hook", () => {
      it("should call all event handlers for that hook in the order they were registered", async () => {
        const eventHandler1 = vi.fn();
        const eventHandler2 = vi.fn();
        const plugin1: StashItPlugin = {
          hookHandlers: {
            beforeSetItem: eventHandler1,
          },
        };
        const plugin2: StashItPlugin = {
          hookHandlers: {
            beforeSetItem: eventHandler2,
          },
        };

        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin1, plugin2]);

        await stashIt.setItem(key, value, extra);

        expect(eventHandler1).toHaveBeenCalledBefore(eventHandler2);
      });
    });
  });
});

const createDummyAdapter = () => {
  const dummyAdapter = mock<StashItAdapter>();

  dummyAdapter.setItem.mockResolvedValue(item);
  dummyAdapter.getItem.mockResolvedValue(item);
  dummyAdapter.hasItem.mockResolvedValue(true);
  dummyAdapter.removeItem.mockResolvedValue(true);
  dummyAdapter.setExtra.mockResolvedValue(extra);
  dummyAdapter.getExtra.mockResolvedValue(extra);

  return dummyAdapter;
};
