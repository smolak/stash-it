import type { Extra, GetExtraResult, GetItemResult, Item, Key, SetExtraResult, Value } from "@stash-it/core";
import { StashItAdapter } from "@stash-it/core";

/** Memory adapter class. */
export class MemoryAdapter extends StashItAdapter {
  #data = new Map<Key, Item>();

  async setItem(key: Key, value: Value, extra: Extra = {}): Promise<Item> {
    this.validateKey(key);

    const item = { key, value, extra };

    this.#data.set(key, item);

    return item;
  }

  async getItem(key: Key): Promise<GetItemResult> {
    return this.#data.get(key);
  }

  async hasItem(key: Key): Promise<boolean> {
    return this.#data.has(key);
  }

  async removeItem(key: Key): Promise<boolean> {
    return this.#data.delete(key);
  }

  async setExtra(key: Key, extra: Extra): Promise<SetExtraResult> {
    const item = this.#data.get(key);

    if (item) {
      item.extra = extra;

      this.#data.set(key, item);

      return extra;
    }

    return false;
  }

  async getExtra(key: Key): Promise<GetExtraResult> {
    return this.#data.get(key)?.extra;
  }
}
