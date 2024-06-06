import {
  type AdapterInterface,
  type Extra,
  ExtraNotSetException,
  type Item,
  ItemNotRemovedException,
  ItemNotSetException,
  type ItemRemoveResult,
  type Key,
  type StashItInterface,
  type Value,
} from "./types";

export class StashIt implements StashItInterface {
  #adapter: AdapterInterface;

  constructor(adapter: AdapterInterface) {
    this.#adapter = adapter;
  }

  #buildKey(key: Key): Key {
    return key;
  }

  async getExtra(key: Key): Promise<Extra | undefined> {
    return this.#adapter.getExtra(this.#buildKey(key));
  }

  async getItem(key: Key): Promise<Item | undefined> {
    return this.#adapter.getItem(this.#buildKey(key));
  }

  async hasItem(key: Key): Promise<boolean> {
    return this.#adapter.hasItem(this.#buildKey(key));
  }

  async removeItem(key: Key): Promise<ItemRemoveResult | ItemNotRemovedException> {
    return this.#adapter.removeItem(this.#buildKey(key));
  }

  async setExtra(key: Key, extra: Extra): Promise<Extra | ExtraNotSetException> {
    return this.#adapter.setExtra(this.#buildKey(key), extra);
  }

  async setItem(key: Key, value: Value, extra: Extra): Promise<Item | ItemNotSetException> {
    return this.#adapter.setItem(this.#buildKey(key), value, extra);
  }
}
