import type {
  StashItAdapterInterface,
  EventHandlerArgs,
  EventHandlers,
  Extra,
  GetExtraResult,
  GetItemResult,
  Item,
  Key,
  Plugin,
  SetExtraResult,
  StashItInterface,
  Value,
} from "@stash-it/core";

export class StashIt implements StashItInterface {
  #adapter: StashItAdapterInterface;
  #eventHandlers: EventHandlers = {
    buildKey: [],
    preSetItem: [],
    postSetItem: [],
    preGetItem: [],
    postGetItem: [],
    preHasItem: [],
    postHasItem: [],
    preRemoveItem: [],
    postRemoveItem: [],
    preSetExtra: [],
    postSetExtra: [],
    preGetExtra: [],
    postGetExtra: [],
  };

  constructor(adapter: StashItAdapterInterface) {
    this.#adapter = adapter;
  }

  async #buildKey(key: Key): Promise<Key> {
    const result = await this.#emit<"buildKey">("buildKey", { key });

    return result.key;
  }

  async setItem(key: Key, value: Value, extra: Extra = {}): Promise<Item> {
    const preData = await this.#emit("preSetItem", { key, value, extra });
    const setItem = await this.#adapter.setItem(await this.#buildKey(preData.key), preData.value, preData.extra);
    const postData = await this.#emit("postSetItem", { ...preData, item: setItem });

    return postData.item;
  }

  async getItem(key: Key): Promise<GetItemResult> {
    const preData = await this.#emit("preGetItem", { key });
    const item = await this.#adapter.getItem(await this.#buildKey(preData.key));
    const postData = await this.#emit("postGetItem", { ...preData, item });

    return postData.item;
  }

  async hasItem(key: Key): Promise<boolean> {
    const preData = await this.#emit("preHasItem", { key });
    const result = await this.#adapter.hasItem(await this.#buildKey(preData.key));
    const postData = await this.#emit("postHasItem", { ...preData, result });

    return postData.result;
  }

  async removeItem(key: Key): Promise<boolean> {
    const preData = await this.#emit("preRemoveItem", { key });
    const result = await this.#adapter.removeItem(await this.#buildKey(preData.key));
    const postData = await this.#emit("postRemoveItem", { ...preData, result });

    return postData.result;
  }

  async setExtra(key: Key, extra: Extra): Promise<SetExtraResult> {
    const preData = await this.#emit("preSetExtra", { key, extra });
    const extraSet = await this.#adapter.setExtra(await this.#buildKey(preData.key), preData.extra);
    const postData = await this.#emit("postSetExtra", { ...preData, extra: extraSet });

    return postData.extra;
  }

  async getExtra(key: Key): Promise<GetExtraResult> {
    const preData = await this.#emit("preGetExtra", { key });
    const extra = await this.#adapter.getExtra(await this.#buildKey(preData.key));
    const postData = await this.#emit("postGetExtra", { ...preData, extra });

    return postData.extra;
  }

  registerPlugins(plugins: Plugin[]) {
    plugins.forEach((plugin) => {
      const { eventHandlers } = plugin;
      let event: keyof EventHandlers;

      for (event in eventHandlers) {
        const eventHandler = eventHandlers[event];

        if (eventHandler) {
          // I know this is right (covered by tests), but I don't know how to TS guard it :/
          // @ts-ignore
          this.#eventHandlers[event] = [...this.#eventHandlers[event], eventHandler];
        }
      }
    });
  }

  async #emit<EventType extends keyof EventHandlers>(
    event: EventType,
    args: EventHandlerArgs[EventType],
  ): Promise<EventHandlerArgs[EventType]> {
    const handlers = this.#eventHandlers[event];
    let newArgs = args;

    if (handlers.length > 0) {
      for (const handler of handlers) {
        // I know this is right (covered by tests), but I don't know how to TS guard it :/
        // @ts-ignore
        const result = await handler(newArgs);

        newArgs = { ...newArgs, ...result };
      }
    }

    return newArgs;
  }
}
