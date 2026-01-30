import type { Key, StashItPlugin } from "@stash-it/core";
import { z } from "zod";

/** Prefix/suffix plugin options. */
export interface PrefixSuffixPluginOptions {
  /** Prefix to add to the key. */
  prefix?: string;
  /** Suffix to add to the key. */
  suffix?: string;
}

const PrefixSuffixSchema = z.string().trim().min(1).optional();
const PluginOptionsSchema = z
  .object({
    prefix: PrefixSuffixSchema,
    suffix: PrefixSuffixSchema,
  })
  .refine((values) => values.prefix || values.suffix, {
    message: "Either prefix or suffix should be set.",
    path: [],
  });

const dropPrefix = (key: Key, prefix: string): Key => {
  if (prefix && key.startsWith(prefix)) {
    return key.slice(prefix.length);
  }

  return key;
};

const dropSuffix = (key: Key, suffix: string): Key => {
  if (suffix && key.endsWith(suffix)) {
    return key.slice(0, -suffix.length);
  }

  return key;
};

/**
 * Create a plugin that prefixes and/or suffixes the key.
 *
 * @param options Plugin options
 */
export const createPrefixSuffixPlugin = (options: PrefixSuffixPluginOptions): StashItPlugin => {
  const values = PluginOptionsSchema.parse(options);

  const prefix = values.prefix ?? "";
  const suffix = values.suffix ?? "";

  return {
    hookHandlers: {
      buildKey: async ({ key }) => ({ key: `${prefix}${key}${suffix}` }),
      afterSetItem: async (args) => {
        return {
          ...args,
          key: dropPrefix(dropSuffix(args.key, suffix), prefix),
          item: { ...args.item, key: dropPrefix(dropSuffix(args.item.key, suffix), prefix) },
        };
      },
      afterGetItem: async (args) => {
        if (args.item) {
          return {
            ...args,
            key: dropPrefix(dropSuffix(args.key, suffix), prefix),
            item: { ...args.item, key: dropPrefix(dropSuffix(args.item.key, suffix), prefix) },
          };
        }

        return args;
      },
    },
  };
};
