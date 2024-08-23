import { type Key, type StashItPlugin } from "@stash-it/core";
import z from "zod";

const PrefixSuffixSchema = z.string().trim().min(1).optional();
const PluginOptionsSchema = z
  .object({
    prefix: PrefixSuffixSchema,
    suffix: PrefixSuffixSchema,
  })
  .superRefine((values, ctx) => {
    if (!values.prefix && !values.suffix) {
      ctx.addIssue({
        message: "Either prefix or suffix should be set.",
        code: z.ZodIssueCode.custom,
        path: ["prefix"],
      });
      ctx.addIssue({
        message: "Either prefix or suffix should be set.",
        code: z.ZodIssueCode.custom,
        path: ["suffix"],
      });
    }
  });

type PluginOptions = z.infer<typeof PluginOptionsSchema>;

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

export const createPrefixSuffixPlugin = (options: PluginOptions): StashItPlugin => {
  const values = PluginOptionsSchema.parse(options);

  // TODO: move this to schema at some point.
  const prefix = values.prefix ?? "";
  const suffix = values.suffix ?? "";

  return {
    hookHandlers: {
      buildKey: async ({ key }) => ({ key: `${prefix}${key}${suffix}` }),
      afterSetItem: async (args) => {
        return { ...args, item: { ...args.item, key: dropPrefix(dropSuffix(args.item.key, suffix), prefix) } };
      },
      afterGetItem: async (args) => {
        if (args.item) {
          return { ...args, item: { ...args.item, key: dropPrefix(dropSuffix(args.item.key, suffix), prefix) } };
        }

        return args;
      },
    },
  };
};
