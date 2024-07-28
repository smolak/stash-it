import type {
  Extra,
  GetExtraResult,
  GetItemResult,
  HookHandlerArgs,
  Item,
  Key,
  Plugin,
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
    const preData = await this.#call("beforeSetItem", { key, value, extra });
    const setItem = await this.#adapter.setItem(await this.#buildKey(preData.key), preData.value, preData.extra);
    const postData = await this.#call("afterSetItem", { ...preData, item: setItem });

    return postData.item;
  }

  async getItem(key: Key): Promise<GetItemResult> {
    const preData = await this.#call("beforeGetItem", { key });
    const item = await this.#adapter.getItem(await this.#buildKey(preData.key));
    const postData = await this.#call("afterGetItem", { ...preData, item });

    return postData.item;
  }

  async hasItem(key: Key): Promise<boolean> {
    const preData = await this.#call("beforeHasItem", { key });
    const result = await this.#adapter.hasItem(await this.#buildKey(preData.key));
    const postData = await this.#call("afterHasItem", { ...preData, result });

    return postData.result;
  }

  async removeItem(key: Key): Promise<boolean> {
    const preData = await this.#call("beforeRemoveItem", { key });
    const result = await this.#adapter.removeItem(await this.#buildKey(preData.key));
    const postData = await this.#call("afterRemoveItem", { ...preData, result });

    return postData.result;
  }

  async setExtra(key: Key, extra: Extra): Promise<SetExtraResult> {
    const preData = await this.#call("beforeSetExtra", { key, extra });
    const extraSet = await this.#adapter.setExtra(await this.#buildKey(preData.key), preData.extra);
    const postData = await this.#call("afterSetExtra", { ...preData, extra: extraSet });

    return postData.extra;
  }

  async getExtra(key: Key): Promise<GetExtraResult> {
    const preData = await this.#call("beforeGetExtra", { key });
    const extra = await this.#adapter.getExtra(await this.#buildKey(preData.key));
    const postData = await this.#call("afterGetExtra", { ...preData, extra });

    return postData.extra;
  }

  registerPlugins(plugins: Plugin[]) {
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
