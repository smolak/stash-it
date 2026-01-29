import type { StashItPlugin } from "@stash-it/core";
import z from "zod";

const errorMessageSchema = z.string().trim().min(1);
const pluginOptionsSchema = z.object({
  setItemErrorMessage: errorMessageSchema.default("Overwriting items is not allowed!"),
  removeItemErrorMessage: errorMessageSchema.default("Removing items is not allowed!"),
  setExtraErrorMessage: errorMessageSchema.default("Overwriting data in items is not allowed!"),
});

type PluginOptions = z.input<typeof pluginOptionsSchema>;

/**
 * Creates a plugin that prohibits making any changes in the storage,
 * allowing only for "read" operations.
 *
 * @param options Plugin options
 * @returns StashItPlugin
 */
export const createReadOnlyPlugin = (options: PluginOptions = {}): StashItPlugin => {
  const errorMessages = pluginOptionsSchema.parse(options);

  return {
    hookHandlers: {
      beforeSetItem: async () => {
        throw new Error(errorMessages.setItemErrorMessage);
      },
      beforeRemoveItem: async () => {
        throw new Error(errorMessages.removeItemErrorMessage);
      },
      beforeSetExtra: async () => {
        throw new Error(errorMessages.setExtraErrorMessage);
      },
    },
  };
};
