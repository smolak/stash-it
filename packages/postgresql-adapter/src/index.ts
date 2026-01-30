import type { Extra, GetExtraResult, GetItemResult, Item, Key, SetExtraResult, Value } from "@stash-it/core";
import { StashItAdapter } from "@stash-it/core";
import { Client, type QueryResultRow } from "pg";
import { postgreSqlAdapterConfigurationSchema } from "./_schema";

/** PostgreSQL adapter table configuration. */
export interface PostgreSqlAdapterTableConfiguration {
  tableName?: string;
  keyColumnName?: string;
  valueColumnName?: string;
  extraColumnName?: string;
}

/** PostgreSQL adapter connection configuration. */
export interface PostgreSqlAdapterConnectionConfiguration {
  host: string;
  user: string;
  password: string;
  database: string;
  port?: number;
}

/**
 * PostgreSQL adapter configuration.
 */
export interface PostgreSqlAdapterConfiguration {
  connection: PostgreSqlAdapterConnectionConfiguration;
  table?: PostgreSqlAdapterTableConfiguration;
}

interface PartialItem extends QueryResultRow {
  value: {
    value: Value;
  };
  extra: Extra;
}

interface ExtraItem extends QueryResultRow {
  extra: Extra;
}

interface ItemExists extends QueryResultRow {
  item_exists: boolean;
}

/**
 * PostgreSQL adapter class.
 *
 * The LIMIT 1 is used to make sure that only one row is selected, updated or deleted.
 * The reason for this is that the library can't know if the key is unique or not.
 */
export class PostgreSqlAdapter extends StashItAdapter {
  readonly #tableName: string;
  readonly #keyColumnName: string;
  readonly #valueColumnName: string;
  readonly #extraColumnName: string;

  #client: Client;
  #connectionConfiguration: Required<PostgreSqlAdapterConnectionConfiguration>;

  constructor(configuration: PostgreSqlAdapterConfiguration) {
    super();

    const {
      connection,
      table: { tableName, keyColumnName, valueColumnName, extraColumnName },
    } = postgreSqlAdapterConfigurationSchema.parse(configuration);

    this.#connectionConfiguration = connection;

    this.#tableName = tableName;
    this.#keyColumnName = keyColumnName;
    this.#valueColumnName = valueColumnName;
    this.#extraColumnName = extraColumnName;
  }

  override async connect(): Promise<void> {
    this.#client = new Client(this.#connectionConfiguration);

    await this.#client.connect();
  }

  override async disconnect(): Promise<void> {
    await this.#client.end();
  }

  async setItem(key: Key, value: Value, extra: Extra = {}): Promise<Item> {
    this.validateKey(key);

    const itemExists = await this.hasItem(key);

    if (itemExists) {
      await this.#client.query(
        `UPDATE "${this.#tableName}"
         SET "${this.#valueColumnName}" = $1::JSONB, "${this.#extraColumnName}" = $2::JSONB
         WHERE "${this.#keyColumnName}" = $3`,
        [{ value }, extra, key],
      );
    } else {
      await this.#client.query(
        `INSERT INTO "${this.#tableName}" ("${this.#keyColumnName}", "${this.#valueColumnName}", "${this.#extraColumnName}")
         VALUES ($1, $2::JSONB, $3::JSONB)`,
        // 1. `value` can be not an object, so it needs to become one
        [key, { value }, extra],
      );
    }

    return { key, value, extra };
  }

  async getItem(key: Key): Promise<GetItemResult> {
    const { rows } = await this.#client.query<PartialItem>(
      `SELECT "${this.#valueColumnName}" AS "value", "${this.#extraColumnName}" as "extra"
       FROM "${this.#tableName}" 
       WHERE "${this.#keyColumnName}" = $1
       LIMIT 1`,
      [key],
    );

    const item = rows[0];

    if (item) {
      return {
        key,
        // 2. And it is unpacked here later on
        value: item.value.value,
        extra: item.extra,
      };
    }
  }

  async hasItem(key: Key): Promise<boolean> {
    const { rows } = await this.#client.query<ItemExists>(
      `SELECT EXISTS (SELECT 1 FROM "${this.#tableName}" WHERE "${this.#keyColumnName}" = $1) AS item_exists`,
      [key],
    );

    const result = rows[0];

    return result?.item_exists === true;
  }

  async removeItem(key: Key): Promise<boolean> {
    const { rowCount } = await this.#client.query(
      `DELETE FROM "${this.#tableName}" WHERE "${this.#keyColumnName}" = $1`,
      [key],
    );

    return rowCount === 1;
  }

  async setExtra(key: Key, extra: Extra): Promise<SetExtraResult> {
    const itemExists = await this.hasItem(key);

    if (itemExists) {
      await this.#client.query(
        `UPDATE "${this.#tableName}"
         SET "${this.#extraColumnName}" = $1::JSONB
         WHERE "${this.#keyColumnName}" = $2`,
        [extra, key],
      );

      return extra;
    }

    return false;
  }

  async getExtra(key: Key): Promise<GetExtraResult> {
    const { rows } = await this.#client.query<ExtraItem>(
      `SELECT "${this.#extraColumnName}" AS "extra"
       FROM "${this.#tableName}"
       WHERE "${this.#keyColumnName}" = $1
       LIMIT 1`,
      [key],
    );

    const result = rows[0];

    return result?.extra;
  }
}
