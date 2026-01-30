import type { StashItPlugin } from "@stash-it/core";
import { describe, expect, it } from "vitest";

import { getHandler } from "./helpers";

describe("getHandler", () => {
  it("returns the handler for a given hook when it exists", async () => {
    const mockHandler = async () => ({ key: "test" });
    const plugin: StashItPlugin = {
      hookHandlers: {
        buildKey: mockHandler,
      },
    };

    const handler = getHandler("buildKey", plugin);

    expect(handler).toBe(mockHandler);
  });

  it("throws an error when handler for given hook is not found", () => {
    const plugin: StashItPlugin = {
      hookHandlers: {
        buildKey: async () => ({ key: "test" }),
      },
    };

    expect(() => getHandler("beforeSetItem", plugin)).toThrow(
      "Handler 'beforeSetItem' was not found. Available handlers: buildKey.",
    );
  });

  it("lists all available handlers in error message when handler is not found", () => {
    const plugin: StashItPlugin = {
      hookHandlers: {
        buildKey: async () => ({ key: "test" }),
        beforeSetItem: async () => ({ key: "test", value: "test", extra: {} }),
        afterGetItem: async () => ({ key: "test", item: undefined }),
      },
    };

    expect(() => getHandler("beforeRemoveItem", plugin)).toThrow(
      "Handler 'beforeRemoveItem' was not found. Available handlers: buildKey, beforeSetItem, afterGetItem.",
    );
  });
});
