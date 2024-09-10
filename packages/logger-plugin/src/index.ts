import { type StashItPlugin, type Hook, type HookHandlerArgs } from "@stash-it/core";

type LogFunction = (
  hook: Hook,
  // eslint-disable-next-line no-unused-vars
  hookHandlerArgs: Omit<HookHandlerArgs[typeof hook], "adapter"> & { adapter: string },
) => void;

async function logAndReturn<H extends Hook>(
  hook: H,
  log: LogFunction,
  args: HookHandlerArgs[H],
): Promise<HookHandlerArgs[H]> {
  log(hook, { ...args, adapter: args.adapter.constructor.name });

  return args;
}

/**
 * Create a plugin that prefixes and/or suffixes the key.
 *
 * @param log Log function.
 */
export const createLoggerPlugin = (log: LogFunction): StashItPlugin => ({
  hookHandlers: {
    buildKey: async (args) => logAndReturn("buildKey", log, args),
    beforeSetItem: async (args) => logAndReturn("beforeSetItem", log, args),
    afterSetItem: async (args) => logAndReturn("afterSetItem", log, args),
    beforeGetItem: async (args) => logAndReturn("beforeGetItem", log, args),
    afterGetItem: async (args) => logAndReturn("afterGetItem", log, args),
    beforeHasItem: async (args) => logAndReturn("beforeHasItem", log, args),
    afterHasItem: async (args) => logAndReturn("afterHasItem", log, args),
    beforeRemoveItem: async (args) => logAndReturn("beforeRemoveItem", log, args),
    afterRemoveItem: async (args) => logAndReturn("afterRemoveItem", log, args),
    beforeSetExtra: async (args) => logAndReturn("beforeSetExtra", log, args),
    afterSetExtra: async (args) => logAndReturn("afterSetExtra", log, args),
    beforeGetExtra: async (args) => logAndReturn("beforeGetExtra", log, args),
    afterGetExtra: async (args) => logAndReturn("afterGetExtra", log, args),
  },
});
