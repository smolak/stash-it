import { describe, expect, it, vi } from "vitest";
import { toHaveBeenCalledBefore } from "jest-extended";
import type { StashItAdapterInterface, Plugin } from "@stash-it/core";
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
        const plugin: Plugin = {
          eventHandlers: {
            buildKey: buildKeyEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.setItem(key, value, extra);

        expect(buildKeyEventHandler).toHaveBeenCalledWith({ key });
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

    describe("when an event handler is registered for preSetItem hook", () => {
      it("should call that event handler with arguments passed to the setItem method", async () => {
        const preSetItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: Plugin = {
          eventHandlers: {
            preSetItem: preSetItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.setItem(key, value, extra);

        expect(preSetItemEventHandler).toHaveBeenCalledWith(item);
      });

      it("adapter's setItem method is called with arguments returned from preSetItem event handler", async () => {
        const plugin: Plugin = {
          eventHandlers: {
            preSetItem: () => Promise.resolve({ key: "new-key", value: "new-value", extra: { new: "extra" } }),
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.setItem(key, value, extra);

        expect(adapter.setItem).toHaveBeenCalledWith("new-key", "new-value", { new: "extra" });
      });
    });

    describe("when an event handler is registered for postSetItem hook", () => {
      it("should call that handler with the arguments passed to the setItem method and item set by the adapter", async () => {
        const postSetItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: Plugin = {
          eventHandlers: {
            postSetItem: postSetItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.setItem(key, value, extra);

        expect(postSetItemEventHandler).toHaveBeenCalledWith({ key, value, extra, item });
      });

      it("returned value is the one coming from postSetItem event handler", async () => {
        const plugin: Plugin = {
          eventHandlers: {
            postSetItem: () =>
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

    describe("when event handlers are set for both preSetItem and postSetItem hooks", () => {
      it("should call postSetItem event handler with arguments returned from preSetItem event handler", async () => {
        const postSetItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: Plugin = {
          eventHandlers: {
            preSetItem: () => Promise.resolve({ key: "new-key", value: "new-value", extra: { new: "extra" } }),
            postSetItem: postSetItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.setItem.mockResolvedValue(item);

        const stashIt = new StashIt(adapter);
        stashIt.registerPlugins([plugin]);

        await stashIt.setItem(key, value, extra);

        expect(postSetItemEventHandler).toHaveBeenCalledWith({
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

    describe("when an event handler is registered for preGetItem hook", () => {
      it("should call that event handler with arguments passed to the getItem method", async () => {
        const preGetItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: Plugin = {
          eventHandlers: {
            preGetItem: preGetItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.getItem(key);

        expect(preGetItemEventHandler).toHaveBeenCalledWith({ key });
      });

      it("adapter's getItem method is called with arguments returned from preGetItem event handler", async () => {
        const plugin: Plugin = {
          eventHandlers: {
            preGetItem: () => Promise.resolve({ key: "new-key" }),
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.getItem(key);

        expect(adapter.getItem).toHaveBeenCalledWith("new-key");
      });
    });

    describe("when an event handler is registered for postGetItem hook", () => {
      it("should call that event handler with the arguments passed to the getItem method and retrieved item", async () => {
        const postGetItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: Plugin = {
          eventHandlers: {
            postGetItem: postGetItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.getItem(key);

        expect(postGetItemEventHandler).toHaveBeenCalledWith({ key, item: { key, value, extra } });
      });

      it("returned value is the one coming from postGetItem event handler", async () => {
        const plugin: Plugin = {
          eventHandlers: {
            postGetItem: () =>
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

    describe("when event handlers are set for both preGetItem and postGetItem hooks", () => {
      it("should call postGetItem event handler with arguments returned from preGetItem event handler", async () => {
        const postGetItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: Plugin = {
          eventHandlers: {
            preGetItem: () => Promise.resolve({ key: "new-key" }),
            postGetItem: postGetItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.getItem.mockResolvedValue(item);

        const stashIt = new StashIt(adapter);
        stashIt.registerPlugins([plugin]);

        await stashIt.getItem(key);

        expect(postGetItemEventHandler).toHaveBeenCalledWith({ key: "new-key", item });
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

    describe("when an event handler is registered for preHasItem hook", () => {
      it("should call that event handler with arguments passed to the hasItem method", async () => {
        const preHasItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: Plugin = {
          eventHandlers: {
            preHasItem: preHasItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.hasItem(key);

        expect(preHasItemEventHandler).toHaveBeenCalledWith({ key });
      });

      it("adapter's hasItem method is called with arguments returned from preHasItem event handler", async () => {
        const plugin: Plugin = {
          eventHandlers: {
            preHasItem: () => Promise.resolve({ key: "new-key" }),
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.hasItem(key);

        expect(adapter.hasItem).toHaveBeenCalledWith("new-key");
      });
    });

    describe("when an event handler is registered for postHasItem hook", () => {
      it("should call that event handler with the arguments passed to the hasItem method and result of finding that item", async () => {
        const postHasItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: Plugin = {
          eventHandlers: {
            postHasItem: postHasItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.hasItem.mockResolvedValue(true);
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.hasItem(key);

        expect(postHasItemEventHandler).toHaveBeenCalledWith({ key, result: true });
      });

      it("returned value is the one coming from postHasItem event handler", async () => {
        const plugin: Plugin = {
          eventHandlers: {
            postHasItem: () =>
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

    describe("when event handlers are set for both preHasItem and postHasItem hooks", () => {
      it("should call postHasItem event handler with arguments returned from preHasItem event handler", async () => {
        const postHasItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: Plugin = {
          eventHandlers: {
            preHasItem: () => Promise.resolve({ key: "new-key" }),
            postHasItem: postHasItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.hasItem.mockResolvedValue(true);

        const stashIt = new StashIt(adapter);
        stashIt.registerPlugins([plugin]);

        await stashIt.hasItem(key);

        expect(postHasItemEventHandler).toHaveBeenCalledWith({ key: "new-key", result: true });
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

    describe("when an event handler is registered for preRemoveItem hook", () => {
      it("should call that event handler with arguments passed to the removeItem method", async () => {
        const preRemoveItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: Plugin = {
          eventHandlers: {
            preRemoveItem: preRemoveItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.removeItem(key);

        expect(preRemoveItemEventHandler).toHaveBeenCalledWith({ key });
      });

      it("adapter's removeItem method is called with arguments returned from preRemoveItem event handler", async () => {
        const plugin: Plugin = {
          eventHandlers: {
            preRemoveItem: () => Promise.resolve({ key: "new-key" }),
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.removeItem(key);

        expect(adapter.removeItem).toHaveBeenCalledWith("new-key");
      });
    });

    describe("when an event handler is registered for postRemoveItem hook", () => {
      it("should call that event handler with the arguments passed to removeItem method and result of removing that item", async () => {
        const postRemoveItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: Plugin = {
          eventHandlers: {
            postRemoveItem: postRemoveItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.removeItem.mockResolvedValue(true);
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.removeItem(key);

        expect(postRemoveItemEventHandler).toHaveBeenCalledWith({ key, result: true });
      });

      it("returned value is the one coming from postRemoveItem event handler", async () => {
        const plugin: Plugin = {
          eventHandlers: {
            postRemoveItem: () =>
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

    describe("when event handlers are set for both preRemoveItem and postRemoveItem hooks", () => {
      it("should call postRemoveItem event handler with arguments returned from preRemoveItem event handler", async () => {
        const postRemoveItemEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: Plugin = {
          eventHandlers: {
            preRemoveItem: () => Promise.resolve({ key: "new-key" }),
            postRemoveItem: postRemoveItemEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.removeItem.mockResolvedValue(true);

        const stashIt = new StashIt(adapter);
        stashIt.registerPlugins([plugin]);

        await stashIt.removeItem(key);

        expect(postRemoveItemEventHandler).toHaveBeenCalledWith({ key: "new-key", result: true });
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

    describe("when an event handler is registered for preSetExtra hook", () => {
      it("should call that event handler with arguments passed to the setExtra method", async () => {
        const preSetExtraEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: Plugin = {
          eventHandlers: {
            preSetExtra: preSetExtraEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.setExtra(key, extra);

        expect(preSetExtraEventHandler).toHaveBeenCalledWith({ key, extra });
      });

      it("adapter's setExtra method is called with arguments returned from preSetExtra event handler", async () => {
        const plugin: Plugin = {
          eventHandlers: {
            preSetExtra: () => Promise.resolve({ key: "new-key", extra: { new: "extra" } }),
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.setExtra(key, extra);

        expect(adapter.setExtra).toHaveBeenCalledWith("new-key", { new: "extra" });
      });
    });

    describe("when an event handler is registered for postSetExtra hook", () => {
      it("should call that event handler with the arguments passed to the setExtra method and extra set", async () => {
        const postSetExtraEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: Plugin = {
          eventHandlers: {
            postSetExtra: postSetExtraEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const extraSet = { ...extra };
        adapter.setExtra.mockResolvedValue(extraSet);
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.setExtra(key, extra);

        expect(postSetExtraEventHandler).toHaveBeenCalledWith({ key, extra });
      });

      it("returned value is the one coming from postSetExtra event handler", async () => {
        const plugin: Plugin = {
          eventHandlers: {
            postSetExtra: () =>
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

    describe("when event handlers are set for both preSetExtra and postSetExtra hooks", () => {
      it("should call postSetExtra event handler with arguments returned from preSetExtra event handler", async () => {
        const postSetExtraEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: Plugin = {
          eventHandlers: {
            preSetExtra: () => Promise.resolve({ key: "new-key", extra: { new: "extra" } }),
            postSetExtra: postSetExtraEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.setExtra.mockResolvedValue(extra);

        const stashIt = new StashIt(adapter);
        stashIt.registerPlugins([plugin]);

        await stashIt.setExtra(key, extra);

        expect(postSetExtraEventHandler).toHaveBeenCalledWith({ key: "new-key", extra });
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

    describe("when an event handler is registered for preGetExtra hook", () => {
      it("should call that event handler with arguments passed to the getExtra method", async () => {
        const preGetExtraEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: Plugin = {
          eventHandlers: {
            preGetExtra: preGetExtraEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.getExtra(key);

        expect(preGetExtraEventHandler).toHaveBeenCalledWith({ key });
      });

      it("adapter's getExtra method is called with arguments returned from preGetExtra event handler", async () => {
        const plugin: Plugin = {
          eventHandlers: {
            preGetExtra: () => Promise.resolve({ key: "new-key" }),
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.getExtra(key);

        expect(adapter.getExtra).toHaveBeenCalledWith("new-key");
      });
    });

    describe("when an event handler is registered for postGetExtra hook", () => {
      it("should call that event handler with the arguments passed to the getExtra method and extra retrieved", async () => {
        const postGetExtraEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: Plugin = {
          eventHandlers: {
            postGetExtra: postGetExtraEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        const stashIt = new StashIt(adapter);

        stashIt.registerPlugins([plugin]);

        await stashIt.getExtra(key);

        expect(postGetExtraEventHandler).toHaveBeenCalledWith({ key, extra });
      });

      it("returned value is the one coming from postGetExtra event handler", async () => {
        const plugin: Plugin = {
          eventHandlers: {
            postGetExtra: () =>
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

    describe("when event handlers are set for both preGetExtra and postGetExtra hooks", () => {
      it("should call postGetExtra event handler with arguments returned from preGetExtra event handler", async () => {
        const postGetExtraEventHandler = vi.fn().mockImplementationOnce((args) => Promise.resolve(args));
        const plugin: Plugin = {
          eventHandlers: {
            preGetExtra: () => Promise.resolve({ key: "new-key", extra: { new: "extra" } }),
            postGetExtra: postGetExtraEventHandler,
          },
        };
        const adapter = createDummyAdapter();
        adapter.getExtra.mockResolvedValue(extra);

        const stashIt = new StashIt(adapter);
        stashIt.registerPlugins([plugin]);

        await stashIt.getExtra(key);

        expect(postGetExtraEventHandler).toHaveBeenCalledWith({ key: "new-key", extra });
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
        const plugin1: Plugin = {
          eventHandlers: {
            preSetItem: eventHandler1,
          },
        };
        const plugin2: Plugin = {
          eventHandlers: {
            preSetItem: eventHandler2,
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
  const dummyAdapter = mock<StashItAdapterInterface>();

  dummyAdapter.setItem.mockResolvedValue(item);
  dummyAdapter.getItem.mockResolvedValue(item);
  dummyAdapter.hasItem.mockResolvedValue(true);
  dummyAdapter.removeItem.mockResolvedValue(true);
  dummyAdapter.setExtra.mockResolvedValue(extra);
  dummyAdapter.getExtra.mockResolvedValue(extra);

  return dummyAdapter;
};
