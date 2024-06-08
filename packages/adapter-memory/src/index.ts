import {
  type AdapterInterface,
  type Extra,
  ExtraNotSetException,
  type Item,
  ItemNotSetException,
  type ItemRemoveResult,
  type Key,
  type Value,
} from "@stash-it/core/src/types";

export class StashItAdapterMemory implements AdapterInterface {
  #data = new Map<Key, Item>();

  async setItem(key: Key, value: Value, extra: Extra = {}): Promise<Item | ItemNotSetException> {
    const item = { key, value, extra };

    this.#data.set(key, item);

    return item;
  }

  async getItem(key: Key): Promise<Item | undefined> {
    return this.#data.get(key);
  }

  async hasItem(key: Key): Promise<boolean> {
    return this.#data.has(key);
  }

  async removeItem(key: Key): Promise<ItemRemoveResult> {
    return this.#data.delete(key);
  }

  async setExtra(key: Key, extra: Extra): Promise<Extra | ExtraNotSetException> {
    const item = this.#data.get(key);

    if (item) {
      item.extra = extra;

      this.#data.set(key, item);

      return extra;
    }

    throw new ExtraNotSetException(key);
  }

  async getExtra(key: Key): Promise<Extra | undefined> {
    return this.#data.get(key)?.extra;
  }
}
