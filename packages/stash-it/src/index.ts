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
  StashItAdapter,
  StashItInterface,
  Value,
} from "@stash-it/core";

/** StashIt class. The main class to use. */
export class StashIt implements StashItInterface {
  readonly #adapter: StashItAdapter;
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

  constructor(adapter: StashItAdapter) {
    this.#adapter = Object.freeze(adapter);
  }

  async #buildKey(key: Key): Promise<Key> {
    const result = await this.#call("buildKey", { key });

    return result.key;
  }

  async setItem(key: Key, value: Value, extra: Extra = {}): Promise<Item> {
    // TODO: add a solid data validation on key, value and extra
    // E.g. sqlite, when searching over JSON in extra, uses `$.fieldname` notation
    // Therefore, field should not consist of dots or a dollar signs. Best if only _azAZ09

    await this.#adapter.connect();

    const beforeData = await this.#call("beforeSetItem", { key, value, extra });
    const builtKey = await this.#buildKey(beforeData.key);
    const setItem = await this.#adapter.setItem(builtKey, beforeData.value, beforeData.extra);
    const afterData = await this.#call("afterSetItem", { ...beforeData, key: builtKey, item: setItem });

    await this.#adapter.disconnect();

    return afterData.item;
  }

  async getItem(key: Key): Promise<GetItemResult> {
    await this.#adapter.connect();

    const beforeData = await this.#call("beforeGetItem", { key });
    const builtKey = await this.#buildKey(beforeData.key);
    const item = await this.#adapter.getItem(builtKey);
    const afterData = await this.#call("afterGetItem", { ...beforeData, key: builtKey, item });

    await this.#adapter.disconnect();

    return afterData.item;
  }

  async hasItem(key: Key): Promise<boolean> {
    await this.#adapter.connect();

    const beforeData = await this.#call("beforeHasItem", { key });
    const builtKey = await this.#buildKey(beforeData.key);
    const result = await this.#adapter.hasItem(builtKey);
    const afterData = await this.#call("afterHasItem", { ...beforeData, key: builtKey, result });

    await this.#adapter.disconnect();

    return afterData.result;
  }

  async removeItem(key: Key): Promise<boolean> {
    await this.#adapter.connect();

    const beforeData = await this.#call("beforeRemoveItem", { key });
    const builtKey = await this.#buildKey(beforeData.key);
    const result = await this.#adapter.removeItem(builtKey);
    const afterData = await this.#call("afterRemoveItem", { ...beforeData, key: builtKey, result });

    await this.#adapter.disconnect();

    return afterData.result;
  }

  async setExtra(key: Key, extra: Extra): Promise<SetExtraResult> {
    await this.#adapter.connect();

    const beforeData = await this.#call("beforeSetExtra", { key, extra });
    const builtKey = await this.#buildKey(beforeData.key);
    const extraSet = await this.#adapter.setExtra(builtKey, beforeData.extra);
    const afterData = await this.#call("afterSetExtra", { ...beforeData, key: builtKey, extra: extraSet });

    await this.#adapter.disconnect();

    return afterData.extra;
  }

  async getExtra(key: Key): Promise<GetExtraResult> {
    await this.#adapter.connect();

    const beforeData = await this.#call("beforeGetExtra", { key });
    const builtKey = await this.#buildKey(beforeData.key);
    const extra = await this.#adapter.getExtra(builtKey);
    const afterData = await this.#call("afterGetExtra", { ...beforeData, key: builtKey, extra });

    await this.#adapter.disconnect();

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
    args: Omit<HookHandlerArgs[Hook], "adapter">,
  ): Promise<Omit<HookHandlerArgs[Hook], "adapter">> {
    const hookHandlers = this.#registeredHookHandlers[hook];
    let newArgs = args;

    if (hookHandlers.length > 0) {
      for (const handler of hookHandlers) {
        // I know this is right (covered by tests), but I don't know how to TS guard it :/
        // @ts-ignore
        const result = await handler({ ...newArgs, adapter: this.#adapter });

        newArgs = { ...newArgs, ...result };
      }
    }

    return newArgs;
  }
}
