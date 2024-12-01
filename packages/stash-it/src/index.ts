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
    this.#adapter = adapter;

    Object.freeze(this.#adapter);
  }

  async checkStorage(): Promise<true> {
    return this.#adapter.checkStorage();
  }

  async #buildKey(key: Key): Promise<Key> {
    const result = await this.#call("buildKey", { key });

    return result.key;
  }

  async setItem(key: Key, value: Value, extra: Extra = {}): Promise<Item> {
    await this.#adapter.connect();

    try {
      const builtKey = await this.#buildKey(key);
      const beforeData = await this.#call("beforeSetItem", { key: builtKey, value, extra });
      const setItem = await this.#adapter.setItem(beforeData.key, beforeData.value, beforeData.extra);
      const afterData = await this.#call("afterSetItem", { ...beforeData, item: setItem });

      await this.#adapter.disconnect();

      return afterData.item;
    } catch (error) {
      await this.#adapter.disconnect();

      throw error;
    }
  }

  async getItem(key: Key): Promise<GetItemResult> {
    await this.#adapter.connect();

    try {
      const builtKey = await this.#buildKey(key);
      const beforeData = await this.#call("beforeGetItem", { key: builtKey });
      const item = await this.#adapter.getItem(beforeData.key);
      const afterData = await this.#call("afterGetItem", { ...beforeData, item });

      await this.#adapter.disconnect();

      return afterData.item;
    } catch (error) {
      await this.#adapter.disconnect();

      throw error;
    }
  }

  async hasItem(key: Key): Promise<boolean> {
    await this.#adapter.connect();

    try {
      const builtKey = await this.#buildKey(key);
      const beforeData = await this.#call("beforeHasItem", { key: builtKey });
      const result = await this.#adapter.hasItem(beforeData.key);
      const afterData = await this.#call("afterHasItem", { ...beforeData, result });

      await this.#adapter.disconnect();

      return afterData.result;
    } catch (error) {
      await this.#adapter.disconnect();

      throw error;
    }
  }

  async removeItem(key: Key): Promise<boolean> {
    await this.#adapter.connect();

    try {
      const builtKey = await this.#buildKey(key);
      const beforeData = await this.#call("beforeRemoveItem", { key: builtKey });
      const result = await this.#adapter.removeItem(beforeData.key);
      const afterData = await this.#call("afterRemoveItem", { ...beforeData, result });

      await this.#adapter.disconnect();

      return afterData.result;
    } catch (error) {
      await this.#adapter.disconnect();

      throw error;
    }
  }

  async setExtra(key: Key, extra: Extra): Promise<SetExtraResult> {
    await this.#adapter.connect();

    try {
      const builtKey = await this.#buildKey(key);
      const beforeData = await this.#call("beforeSetExtra", { key: builtKey, extra });
      const extraSet = await this.#adapter.setExtra(beforeData.key, beforeData.extra);
      const afterData = await this.#call("afterSetExtra", { ...beforeData, extra: extraSet });

      await this.#adapter.disconnect();

      return afterData.extra;
    } catch (error) {
      await this.#adapter.disconnect();

      throw error;
    }
  }

  async getExtra(key: Key): Promise<GetExtraResult> {
    await this.#adapter.connect();

    try {
      const builtKey = await this.#buildKey(key);
      const beforeData = await this.#call("beforeGetExtra", { key: builtKey });
      const extra = await this.#adapter.getExtra(beforeData.key);
      const afterData = await this.#call("afterGetExtra", { ...beforeData, extra });

      await this.#adapter.disconnect();

      return afterData.extra;
    } catch (error) {
      await this.#adapter.disconnect();

      throw error;
    }
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
