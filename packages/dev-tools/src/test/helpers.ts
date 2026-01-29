import type { Hook, HookHandler, HookHandlerArgs, StashItPlugin } from "@stash-it/core";

// TODO: given this is a first helper/util (and aimed for tests specifically), this can be moved to a separate package.
// There will be most likely other helpers/utils that will be used in tests or for creation of plugins/adapters.

/**
 * Get handler for a given hook.
 *
 * @param hook Name of the hook you want to get handler for.
 * @param plugin Plugin that contains the hook handler(s).
 * @returns Handler for a given hook.
 * @throws Error if handler for a given hook was not found.
 *
 * ```ts
 * getHandler("beforeSetItem", plugin);
 * ```
 */
export const getHandler = <H extends Hook>(hook: H, plugin: StashItPlugin): HookHandler<HookHandlerArgs[H]> => {
  if (!plugin.hookHandlers[hook]) {
    throw new Error(
      `Handler '${hook}' was not found. Available handlers: ${Object.keys(plugin.hookHandlers).join(", ")}.`,
    );
  }

  // TODO: this "as" is a hack, but I don't know how to make it work right now.
  return plugin.hookHandlers[hook] as unknown as HookHandler<HookHandlerArgs[H]>;
};
