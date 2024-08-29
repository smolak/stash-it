import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { getHandler } from "@stash-it/dev-tools";
import { StashIt } from "@stash-it/stash-it";
import { MemoryAdapter } from "@stash-it/memory-adapter";

import { createTtlPlugin, TTL_EXTRA_PROPERTY_NAME } from "./index";

// Any adapter can be used here.
const adapter = new MemoryAdapter();

let now: Date;

describe("ttl-plugin", () => {
  beforeEach(() => {
    vi.useFakeTimers();

    now = new Date();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Dodać sprawdzanie, czy extra nie zawiera __ttl, żeby nie nadpisać istniejącego LUB utworzyć takowy, skoro to plugin robi
  // rzucić wyjątkiem, że __ttl jest zarezerwowane

  describe("setting an item", () => {
    it("adds ttl data to an item when it's stored", async () => {
      const plugin = createTtlPlugin({ ttl: 10 });
      const handler = getHandler("beforeSetItem", plugin);

      const result = await handler({ adapter, key: "key", value: "value", extra: {} });

      expect(result.extra.__ttl).toEqual({
        ttl: 10,
        createdAt: now.toISOString(),
      });
    });

    describe(`when extra already contains '${TTL_EXTRA_PROPERTY_NAME}' property`, () => {
      it(`throws an error, as '${TTL_EXTRA_PROPERTY_NAME}' is a reserved property name`, () => {
        const plugin = createTtlPlugin({ ttl: 10 });
        const handler = getHandler("beforeSetItem", plugin);

        expect(() =>
          handler({
            adapter,
            key: "key",
            value: "value",
            extra: { [TTL_EXTRA_PROPERTY_NAME]: "anything" },
          }),
        ).rejects.toThrow(`Extra contains '${TTL_EXTRA_PROPERTY_NAME}' property, which is a reserved property name.`);
      });
    });
  });

  describe("setting extra", () => {
    describe(`when extra already contains '${TTL_EXTRA_PROPERTY_NAME}' property`, () => {
      it(`throws an error, as '${TTL_EXTRA_PROPERTY_NAME}' is a reserved property name`, () => {
        const plugin = createTtlPlugin({ ttl: 10 });
        const handler = getHandler("beforeSetExtra", plugin);

        expect(() =>
          handler({
            adapter,
            key: "key",
            extra: { [TTL_EXTRA_PROPERTY_NAME]: "anything" },
          }),
        ).rejects.toThrow(`Extra contains '${TTL_EXTRA_PROPERTY_NAME}' property, which is a reserved property name.`);
      });
    });
  });

  describe("e2e testing", () => {
    describe("when item's TTL has not expired", () => {
      const ttl = 10;
      const timeInMs = ttl * 1_000;

      it("set item contains ttl data in extra", async () => {
        const stash = new StashIt(new MemoryAdapter());
        stash.registerPlugins([createTtlPlugin({ ttl })]);

        await stash.setItem("key", "value");

        vi.advanceTimersByTime(timeInMs);

        const item = await stash.getItem("key");

        expect(item).toEqual({ key: "key", value: "value", extra: { __ttl: { ttl, createdAt: now.toISOString() } } });
      });

      it("setting extra data keeps ttl data intact", async () => {
        const stash = new StashIt(new MemoryAdapter());
        stash.registerPlugins([createTtlPlugin({ ttl })]);

        await stash.setItem("key", "value", { some: "initial extra" });

        vi.advanceTimersByTime(timeInMs);

        const result = await stash.setExtra("key", { extra: "new extra" });

        expect(result).toEqual({ extra: "new extra", __ttl: { ttl, createdAt: now.toISOString() } });
      });
    });

    describe("when item's TTL has expired", () => {
      const ttl = 10;
      const timeInMs = ttl * 1_000 + 1;

      it("getting an item returns item not found result", async () => {
        const stash = new StashIt(new MemoryAdapter());
        stash.registerPlugins([createTtlPlugin({ ttl })]);

        await stash.setItem("key", "value");

        vi.advanceTimersByTime(timeInMs);

        const result = await stash.getItem("key");

        expect(result).toBeUndefined();
      });

      it("checking if item exists returns item not found result", async () => {
        const stash = new StashIt(new MemoryAdapter());
        stash.registerPlugins([createTtlPlugin({ ttl })]);

        await stash.setItem("key", "value");

        vi.advanceTimersByTime(timeInMs);

        const result = await stash.hasItem("key");

        expect(result).toBe(false);
      });

      it("getting extra returns extra not found result", async () => {
        const stash = new StashIt(new MemoryAdapter());
        stash.registerPlugins([createTtlPlugin({ ttl })]);

        await stash.setItem("key", "value");

        vi.advanceTimersByTime(timeInMs);

        const result = await stash.getExtra("key");

        expect(result).toBeUndefined();
      });

      it("setting extra returns extra could not be set result", async () => {
        const stash = new StashIt(new MemoryAdapter());
        stash.registerPlugins([createTtlPlugin({ ttl })]);

        await stash.setItem("key", "value");

        vi.advanceTimersByTime(timeInMs);

        const result = await stash.setExtra("key", { extra: "new extra" });

        expect(result).toBe(false);
      });

      it("removing an item returns removal unsuccessful result", async () => {
        const stash = new StashIt(new MemoryAdapter());
        stash.registerPlugins([createTtlPlugin({ ttl })]);

        await stash.setItem("key", "value");

        vi.advanceTimersByTime(timeInMs);

        const result = await stash.removeItem("key");

        expect(result).toBe(false);
      });
    });
  });
});
