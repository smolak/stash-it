import { type Plugin } from "@stash-it/core";
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

export const createPrefixSuffixPlugin = (options: PluginOptions): Plugin => {
  const values = PluginOptionsSchema.parse(options);

  // TODO: move this to schema at some point.
  const prefix = values.prefix ?? "";
  const suffix = values.suffix ?? "";

  return {
    hookHandlers: {
      buildKey: ({ key }) => Promise.resolve({ key: `${prefix}${key}${suffix}` }),
    },
  };
};
