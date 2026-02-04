import type { Extra, Key, StashItAdapter, StashItPlugin } from "@stash-it/core";
import { z } from "zod";

/** TTL plugin options. */
export interface TtlPluginOptions {
  /** Time to live in seconds. */
  ttl: number;
}

const pluginOptionsSchema = z.object({
  ttl: z.number().int().positive(),
});

type Ttl = {
  ttl: number;
  createdAt: string;
};

const removeItemIfTtlExpired = async (adapter: StashItAdapter, key: Key, { ttl, createdAt }: Ttl): Promise<void> => {
  const now = new Date();
  const createdAtDate = new Date(createdAt);
  const diff = now.getTime() - createdAtDate.getTime();
  const diffInSeconds = diff / 1000;

  if (diffInSeconds > ttl) {
    await adapter.removeItem(key);
  }
};

/**
 * Name of the property in extra that will hold the ttl data.
 */
export const TTL_EXTRA_PROPERTY_NAME = "__ttl" as const;

/**
 * Type for the extra object containing TTL data.
 * Use this with .use() for type-safe TTL properties.
 */
export interface TtlExtra extends Extra {
  [TTL_EXTRA_PROPERTY_NAME]: Ttl;
}

/**
 * Create a plugin that adds TTL (time to live) to an item that gets stored.
 *
 * @param options Plugin options
 *
 * @example
 * ```typescript
 * const stash = new StashIt(adapter)
 *   .use(createTtlPlugin({ ttl: 3600 })); // Type-safe: stash knows about __ttl
 * ```
 */
export const createTtlPlugin = (options: TtlPluginOptions): StashItPlugin<TtlExtra> => {
  const { ttl } = pluginOptionsSchema.parse(options);

  return {
    hookHandlers: {
      beforeSetItem: async ({ key, value, extra }) => {
        if (TTL_EXTRA_PROPERTY_NAME in extra) {
          throw new Error(`Extra contains '${TTL_EXTRA_PROPERTY_NAME}' property, which is a reserved property name.`);
        }

        return {
          key,
          value,
          extra: {
            ...extra,
            [TTL_EXTRA_PROPERTY_NAME]: {
              ttl,
              createdAt: new Date().toISOString(),
            },
          },
        };
      },
      beforeGetItem: async ({ adapter, key }) => {
        const item = await adapter.getItem(key);

        if (!item) {
          return { key };
        }

        const ttl = item.extra[TTL_EXTRA_PROPERTY_NAME];

        if (ttl) {
          await removeItemIfTtlExpired(adapter, key, ttl as Ttl);
        }

        return { key };
      },
      beforeHasItem: async ({ adapter, key }) => {
        const item = await adapter.getItem(key);

        if (!item) {
          return { key };
        }

        const ttl = item.extra[TTL_EXTRA_PROPERTY_NAME];

        if (ttl) {
          await removeItemIfTtlExpired(adapter, key, ttl as Ttl);
        }

        return { key };
      },
      beforeGetExtra: async ({ adapter, key }) => {
        const item = await adapter.getItem(key);

        if (!item) {
          return { key };
        }

        const ttl = item.extra[TTL_EXTRA_PROPERTY_NAME];

        if (ttl) {
          await removeItemIfTtlExpired(adapter, key, ttl as Ttl);
        }

        return { key };
      },
      beforeSetExtra: async ({ adapter, key, extra }) => {
        if (TTL_EXTRA_PROPERTY_NAME in extra) {
          throw new Error(`Extra contains '${TTL_EXTRA_PROPERTY_NAME}' property, which is a reserved property name.`);
        }

        const item = await adapter.getItem(key);

        if (!item) {
          return { key, extra };
        }

        const ttl = item.extra[TTL_EXTRA_PROPERTY_NAME];

        if (!ttl) {
          return { key, extra };
        }

        await removeItemIfTtlExpired(adapter, key, ttl as Ttl);

        return { key, extra: { ...extra, [TTL_EXTRA_PROPERTY_NAME]: ttl } };
      },
      beforeRemoveItem: async ({ adapter, key }) => {
        const item = await adapter.getItem(key);

        if (!item) {
          return { key };
        }

        const ttl = item.extra[TTL_EXTRA_PROPERTY_NAME];

        if (ttl) {
          await removeItemIfTtlExpired(adapter, key, ttl as Ttl);
        }

        return { key };
      },
    },
  };
};
