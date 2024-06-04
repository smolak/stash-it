import {
  Adapter,
  type BuiltKey,
  type Extra,
  ExtraNotAddedException,
  ExtraNotSetException,
  type Item,
  ItemNotRemovedException,
  ItemNotSetException,
  type Key,
  type Value,
} from "./types";

export class StashIt {
  #adapter: Adapter;

  constructor(adapter: Adapter) {
    this.#adapter = adapter;
  }

  #buildKey(key: Key): BuiltKey {
    return `@__${key}`;
  }

  async addExtra(key: Key, extra: Extra): Promise<Extra | ExtraNotAddedException> {
    return this.#adapter.addExtra(this.#buildKey(key), extra);
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

  async removeItem(key: Key): Promise<true | ItemNotRemovedException> {
    return this.#adapter.removeItem(this.#buildKey(key));
  }

  async setExtra(key: Key, extra: Extra): Promise<Extra | ExtraNotSetException> {
    return this.#adapter.setExtra(this.#buildKey(key), extra);
  }

  async setItem(key: Key, value: Value, extra: Extra): Promise<Item | ItemNotSetException> {
    return this.#adapter.setItem(this.#buildKey(key), value, extra);
  }
}
