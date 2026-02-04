import type {
  Extra,
  GetExtraResult,
  GetItemResult,
  HookHandler,
  HookHandlerArgs,
  Item,
  Key,
  RegisteredHookHandlers,
  SetExtraResult,
  StashItAdapterInterface,
  StashItInterface,
  StashItPlugin,
  Value,
} from "@stash-it/core";

/**
 * StashIt class. The main class to use.
 * @template TExtra - The type of extra data, accumulated from registered plugins
 */
export class StashIt<TExtra extends Extra = Extra> implements StashItInterface<TExtra> {
  readonly #adapter: StashItAdapterInterface;
  #registeredHookHandlers: RegisteredHookHandlers<TExtra> = {
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

    Object.freeze(this.#adapter);
  }

  async checkStorage(): Promise<true> {
    return this.#adapter.checkStorage();
  }

  async #buildKey(key: Key): Promise<Key> {
    const result = await this.#call("buildKey", { key });

    return result.key;
  }

  async setItem(
    key: Key,
    value: Value,
    extra: Partial<TExtra> & Extra = {} as Partial<TExtra> & Extra,
  ): Promise<Item<TExtra>> {
    await this.#adapter.connect();

    try {
      const builtKey = await this.#buildKey(key);
      // Type assertion: hooks work with base Extra, but we pass the user's partial extra
      const beforeData = await this.#call("beforeSetItem", { key: builtKey, value, extra: extra as TExtra });
      const setItem = await this.#adapter.setItem(beforeData.key, beforeData.value, beforeData.extra);
      const afterData = await this.#call("afterSetItem", { ...beforeData, item: setItem as Item<TExtra> });

      await this.#adapter.disconnect();

      return afterData.item;
    } catch (error) {
      await this.#adapter.disconnect();

      throw error;
    }
  }

  async getItem(key: Key): Promise<GetItemResult<TExtra>> {
    await this.#adapter.connect();

    try {
      const builtKey = await this.#buildKey(key);
      const beforeData = await this.#call("beforeGetItem", { key: builtKey });
      const item = await this.#adapter.getItem(beforeData.key);
      const afterData = await this.#call("afterGetItem", { ...beforeData, item: item as GetItemResult<TExtra> });

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

  async setExtra(key: Key, extra: Partial<TExtra> & Extra): Promise<SetExtraResult<TExtra>> {
    await this.#adapter.connect();

    try {
      const builtKey = await this.#buildKey(key);
      // Type assertion: hooks work with base Extra, but we pass the user's partial extra
      const beforeData = await this.#call("beforeSetExtra", { key: builtKey, extra: extra as TExtra });
      const extraSet = await this.#adapter.setExtra(beforeData.key, beforeData.extra);
      const afterData = await this.#call("afterSetExtra", {
        ...beforeData,
        extra: extraSet as SetExtraResult<TExtra>,
      });

      await this.#adapter.disconnect();

      return afterData.extra;
    } catch (error) {
      await this.#adapter.disconnect();

      throw error;
    }
  }

  async getExtra(key: Key): Promise<GetExtraResult<TExtra>> {
    await this.#adapter.connect();

    try {
      const builtKey = await this.#buildKey(key);
      const beforeData = await this.#call("beforeGetExtra", { key: builtKey });
      const extra = await this.#adapter.getExtra(beforeData.key);
      const afterData = await this.#call("afterGetExtra", { ...beforeData, extra: extra as GetExtraResult<TExtra> });

      await this.#adapter.disconnect();

      return afterData.extra;
    } catch (error) {
      await this.#adapter.disconnect();

      throw error;
    }
  }

  /**
   * Register a plugin and return a typed StashIt instance.
   * Plugins can be chained for type-safe composition.
   *
   * @example
   * ```typescript
   * const stash = new StashIt(adapter)
   *   .use(createTagsPlugin())
   *   .use(createTtlPlugin({ ttl: 3600 }));
   *
   * // Now __tags and __ttl are typed in extra!
   * await stash.setItem('key', value, { __tags: ['movie'], __ttl: { ... } });
   * ```
   */
  use<PAddsExtra extends Extra>(plugin: StashItPlugin<PAddsExtra>): StashIt<TExtra & PAddsExtra> {
    const { hookHandlers } = plugin;
    let hook: keyof RegisteredHookHandlers<TExtra>;

    for (hook in hookHandlers) {
      const hookHandler = hookHandlers[hook];

      if (hookHandler) {
        // Type assertion required: TypeScript cannot correlate indexed access types
        // across different objects (hookHandlers vs registeredHookHandlers).
        // The runtime type safety is ensured by the for-in loop only yielding valid hooks.
        (this.#registeredHookHandlers as Record<keyof RegisteredHookHandlers<TExtra>, unknown[]>)[hook] = [
          ...this.#registeredHookHandlers[hook],
          hookHandler,
        ];
      }
    }

    return this as unknown as StashIt<TExtra & PAddsExtra>;
  }

  async #call<Hook extends keyof RegisteredHookHandlers<TExtra>>(
    hook: Hook,
    args: Omit<HookHandlerArgs<TExtra>[Hook], "adapter">,
  ): Promise<Omit<HookHandlerArgs<TExtra>[Hook], "adapter">> {
    const hookHandlers = this.#registeredHookHandlers[hook];
    let newArgs = args;

    if (hookHandlers.length > 0) {
      for (const handler of hookHandlers) {
        // Type assertion required: TypeScript cannot narrow the handler's parameter type
        // based on the generic Hook type when iterating over the array.
        const typedHandler = handler as unknown as HookHandler<HookHandlerArgs<TExtra>[Hook]>;
        const result = await typedHandler({
          ...newArgs,
          adapter: this.#adapter,
        } as HookHandlerArgs<TExtra>[Hook]);

        newArgs = { ...newArgs, ...result };
      }
    }

    return newArgs;
  }
}
