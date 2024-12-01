import type { Extra, GetExtraResult, GetItemResult, Item, Key, SetExtraResult, Value } from "@stash-it/core";
import { StashItAdapter } from "@stash-it/core";
import { createClient, type RedisClientType } from "redis";
import { z } from "zod";

const redisAdapterConfigurationSchema = z.object({
  url: z.string().url(),
});

type RedisAdapterConfiguration = z.infer<typeof redisAdapterConfigurationSchema>;

/**
 * Redis adapter class.
 */
export class RedisAdapter extends StashItAdapter {
  readonly #database: RedisClientType;

  constructor(configuration: RedisAdapterConfiguration) {
    super();

    const { url } = redisAdapterConfigurationSchema.parse(configuration);

    this.#database = createClient({
      url,
    });
  }

  override async connect() {
    await this.#database.connect();
  }

  override async disconnect() {
    await this.#database.disconnect();
  }

  async setItem(key: Key, value: Value, extra: Extra = {}): Promise<Item> {
    this.validateKey(key);

    await this.#database.HSET(key, {
      value: JSON.stringify(value),
      extra: JSON.stringify(extra),
    });

    return { key, value, extra };
  }

  async getItem(key: Key): Promise<GetItemResult> {
    const item = await this.#database.HGETALL(key);

    if (item && item.value && item.extra) {
      return {
        key,
        value: JSON.parse(item.value),
        extra: JSON.parse(item.extra),
      };
    }
  }

  async hasItem(key: Key): Promise<boolean> {
    const result = await this.#database.EXISTS(key);

    return result === 1;
  }

  async removeItem(key: Key): Promise<boolean> {
    const result = await this.#database.DEL(key);

    return result === 1;
  }

  async setExtra(key: Key, extra: Extra): Promise<SetExtraResult> {
    const item = await this.#database.HGETALL(key);

    if (item && item.extra) {
      await this.#database.HSET(key, "extra", JSON.stringify(extra));

      return extra;
    }

    return false;
  }

  async getExtra(key: Key): Promise<GetExtraResult> {
    const item = await this.#database.HGETALL(key);

    if (item && item.extra) {
      return JSON.parse(item.extra);
    }
  }
}
