import type { Plugin } from "@stash-it/core";
import z from "zod";

const PrefixSuffixSchema = z.string().trim().min(1).or(z.literal(""));
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

export const createPrefixSuffixPlugin = (options: PluginOptions): Plugin => {
  const { prefix, suffix } = PluginOptionsSchema.parse(options);

  return {
    eventHandlers: {
      buildKey: ({ key }) => {
        return Promise.resolve({ key: `${prefix}${key}${suffix}` });
      },
    },
  };
};
