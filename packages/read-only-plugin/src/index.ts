import type { StashItPlugin } from "@stash-it/core";
import { z } from "zod";

/** Read-only plugin options. */
export interface ReadOnlyPluginOptions {
  /** Error message when trying to set an item. */
  setItemErrorMessage?: string;
  /** Error message when trying to remove an item. */
  removeItemErrorMessage?: string;
  /** Error message when trying to set extra data. */
  setExtraErrorMessage?: string;
}

interface ReadOnlyPluginOptionsOutput {
  setItemErrorMessage: string;
  removeItemErrorMessage: string;
  setExtraErrorMessage: string;
}

const errorMessageSchema = z.string().trim().min(1);
const pluginOptionsSchema = z.object({
  setItemErrorMessage: errorMessageSchema.default("Overwriting items is not allowed!"),
  removeItemErrorMessage: errorMessageSchema.default("Removing items is not allowed!"),
  setExtraErrorMessage: errorMessageSchema.default("Overwriting data in items is not allowed!"),
});

/**
 * Creates a plugin that prohibits making any changes in the storage,
 * allowing only for "read" operations.
 *
 * @param options Plugin options
 * @returns StashItPlugin
 */
export const createReadOnlyPlugin = (options: ReadOnlyPluginOptions = {}): StashItPlugin => {
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
