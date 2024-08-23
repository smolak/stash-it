import type {
  Extra,
  GetExtraResult,
  GetItemResult,
  HookHandlerArgs,
  Item,
  Key,
  StashItPlugin,
  RegisteredHookHandlers,
  SetExtraResult,
  StashItAdapterInterface,
  StashItInterface,
  Value,
} from "@stash-it/core";

/** StashIt class. The main class to use. */
export class StashIt implements StashItInterface {
  #adapter: StashItAdapterInterface;
  #registeredHookHandlers: RegisteredHookHandlers = {
    buildKey: [],
    beforeSetItem: [],
    afterSetItem: [],
    beforeGetItem: [],
    afterGetItem: [],
    beforeHasItem: [],
    afterHasItem: [],
    beforeRemoveItem: [],
    afterRemoveItem: [],
    beforeSetExtra: [],
    afterSetExtra: [],
    beforeGetExtra: [],
    afterGetExtra: [],
  };

  constructor(adapter: StashItAdapterInterface) {
    this.#adapter = adapter;
  }

  async #buildKey(key: Key): Promise<Key> {
    const result = await this.#call<"buildKey">("buildKey", { key });

    return result.key;
  }

  async setItem(key: Key, value: Value, extra: Extra = {}): Promise<Item> {
    // TODO: add a solid data validation on key, value and extra
    // E.g. sqlite, when searching over JSON in extra, uses `$.fieldname` notation
    // Therefore, field should not consist of dots or a dollar signs. Best if only _azAZ09

    const beforeData = await this.#call("beforeSetItem", { key, value, extra });
    const setItem = await this.#adapter.setItem(
      await this.#buildKey(beforeData.key),
      beforeData.value,
      beforeData.extra,
    );
    const afterData = await this.#call("afterSetItem", { ...beforeData, item: setItem });

    return afterData.item;
  }

  async getItem(key: Key): Promise<GetItemResult> {
    const beforeData = await this.#call("beforeGetItem", { key });
    const item = await this.#adapter.getItem(await this.#buildKey(beforeData.key));
    const afterData = await this.#call("afterGetItem", { ...beforeData, item });

    return afterData.item;
  }

  async hasItem(key: Key): Promise<boolean> {
    const beforeData = await this.#call("beforeHasItem", { key });
    const result = await this.#adapter.hasItem(await this.#buildKey(beforeData.key));
    const afterData = await this.#call("afterHasItem", { ...beforeData, result });

    return afterData.result;
  }

  async removeItem(key: Key): Promise<boolean> {
    const beforeData = await this.#call("beforeRemoveItem", { key });
    const result = await this.#adapter.removeItem(await this.#buildKey(beforeData.key));
    const afterData = await this.#call("afterRemoveItem", { ...beforeData, result });

    return afterData.result;
  }

  async setExtra(key: Key, extra: Extra): Promise<SetExtraResult> {
    const beforeData = await this.#call("beforeSetExtra", { key, extra });
    const extraSet = await this.#adapter.setExtra(await this.#buildKey(beforeData.key), beforeData.extra);
    const afterData = await this.#call("afterSetExtra", { ...beforeData, extra: extraSet });

    return afterData.extra;
  }

  async getExtra(key: Key): Promise<GetExtraResult> {
    const beforeData = await this.#call("beforeGetExtra", { key });
    const extra = await this.#adapter.getExtra(await this.#buildKey(beforeData.key));
    const afterData = await this.#call("afterGetExtra", { ...beforeData, extra });

    return afterData.extra;
  }

  registerPlugins(plugins: StashItPlugin[]) {
    plugins.forEach((plugin) => {
      const { hookHandlers } = plugin;
      let hook: keyof RegisteredHookHandlers;

      for (hook in hookHandlers) {
        const hookHandler = hookHandlers[hook];

        if (hookHandler) {
          // I know this is right (covered by tests), but I don't know how to TS guard it :/
          // @ts-ignore
          this.#registeredHookHandlers[hook] = [...this.#registeredHookHandlers[hook], hookHandler];
        }
      }
    });
  }

  async #call<Hook extends keyof RegisteredHookHandlers>(
    hook: Hook,
    args: HookHandlerArgs[Hook],
  ): Promise<HookHandlerArgs[Hook]> {
    const hookHandlers = this.#registeredHookHandlers[hook];
    let newArgs = args;

    if (hookHandlers.length > 0) {
      for (const handler of hookHandlers) {
        // I know this is right (covered by tests), but I don't know how to TS guard it :/
        // @ts-ignore
        const result = await handler(newArgs);

        newArgs = { ...newArgs, ...result };
      }
    }

    return newArgs;
  }
}
