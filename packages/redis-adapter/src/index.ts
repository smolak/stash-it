import type {
  Extra,
  GetExtraResult,
  GetItemResult,
  Item,
  Key,
  SetExtraResult,
  StashItAdapterInterface,
  Value,
} from "@stash-it/core";
import { createClient, type RedisClientType } from "redis";
import { z } from "zod";

const redisAdapterOptionsSchema = z.object({
  url: z.string().url(),
});

type RedisAdapterOptions = z.infer<typeof redisAdapterOptionsSchema>;

/**
 * Redis adapter class.
 */
export class RedisAdapter implements StashItAdapterInterface {
  readonly #database: RedisClientType;

  constructor(options: RedisAdapterOptions) {
    const { url } = redisAdapterOptionsSchema.parse(options);

    this.#database = createClient({
      url,
    });
  }

  async setItem(key: Key, value: Value, extra: Extra = {}): Promise<Item> {
    await this.#database.connect();

    await this.#database.HSET(key, {
      value: JSON.stringify(value),
      extra: JSON.stringify(extra),
    });

    await this.#database.disconnect();

    return { key, value, extra };
  }

  async getItem(key: Key): Promise<GetItemResult> {
    await this.#database.connect();

    const item = await this.#database.HGETALL(key);

    if (item && item.value && item.extra) {
      await this.#database.disconnect();

      return {
        key,
        value: JSON.parse(item.value),
        extra: JSON.parse(item.extra),
      };
    }

    await this.#database.disconnect();
  }

  async hasItem(key: Key): Promise<boolean> {
    await this.#database.connect();

    const result = await this.#database.EXISTS(key);

    await this.#database.disconnect();

    return result === 1;
  }

  async removeItem(key: Key): Promise<boolean> {
    await this.#database.connect();

    const result = await this.#database.DEL(key);

    await this.#database.disconnect();

    return result === 1;
  }

  async setExtra(key: Key, extra: Extra): Promise<SetExtraResult> {
    await this.#database.connect();

    const item = await this.#database.HGETALL(key);

    if (item && item.extra) {
      await this.#database.HSET(key, "extra", JSON.stringify(extra));

      await this.#database.disconnect();

      return extra;
    }

    await this.#database.disconnect();

    return false;
  }

  async getExtra(key: Key): Promise<GetExtraResult> {
    await this.#database.connect();

    const item = await this.#database.HGETALL(key);

    if (item && item.extra) {
      await this.#database.disconnect();

      return JSON.parse(item.extra);
    }

    await this.#database.disconnect();
  }
}
