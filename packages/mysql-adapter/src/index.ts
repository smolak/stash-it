import type { Extra, GetExtraResult, GetItemResult, Item, Key, SetExtraResult, Value } from "@stash-it/core";
import { StashItAdapter } from "@stash-it/core";
import { type Connection, createConnection, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { mySqlAdapterConfigurationSchema } from "./_schema";

/** MySQL adapter table configuration. */
export interface MySqlAdapterTableConfiguration {
  tableName?: string;
  keyColumnName?: string;
  valueColumnName?: string;
  extraColumnName?: string;
}

/** MySQL adapter connection configuration. */
export interface MySqlAdapterConnectionConfiguration {
  host: string;
  user: string;
  password: string;
  database: string;
  port?: number;
}

/**
 * MySQL adapter configuration.
 */
export interface MySqlAdapterConfiguration {
  connection: MySqlAdapterConnectionConfiguration;
  table?: MySqlAdapterTableConfiguration;
}

interface PartialItem extends RowDataPacket {
  value: Value;
  extra: Extra;
}

interface ExtraItem extends RowDataPacket {
  extra: Extra;
}

interface ItemExists extends RowDataPacket {
  item_exists: number;
}

/**
 * MySQL adapter class.
 *
 * The LIMIT 1 is used to make sure that only one row is selected, updated or deleted.
 * The reason for this is that the library can't know if the key is unique or not.
 */
export class MySqlAdapter extends StashItAdapter {
  readonly #connectionConfiguration: Required<MySqlAdapterConnectionConfiguration>;
  readonly #tableName: string;
  readonly #keyColumnName: string;
  readonly #valueColumnName: string;
  readonly #extraColumnName: string;

  #connection: Connection;

  constructor(configuration: MySqlAdapterConfiguration) {
    super();

    const {
      connection,
      table: { tableName, keyColumnName, valueColumnName, extraColumnName },
    } = mySqlAdapterConfigurationSchema.parse(configuration);

    this.#connectionConfiguration = connection;
    this.#tableName = tableName;
    this.#keyColumnName = keyColumnName;
    this.#valueColumnName = valueColumnName;
    this.#extraColumnName = extraColumnName;
  }

  override async connect(): Promise<void> {
    this.#connection = await createConnection(this.#connectionConfiguration);
  }

  override async disconnect(): Promise<void> {
    await this.#connection.end();
  }

  async setItem(key: Key, value: Value, extra: Extra = {}): Promise<Item> {
    this.validateKey(key);

    const itemExists = await this.hasItem(key);

    if (itemExists) {
      await this.#connection.execute(
        `UPDATE \`${this.#tableName}\`
         SET \`${this.#valueColumnName}\` = ?, \`${this.#extraColumnName}\` = ?
         WHERE \`${this.#keyColumnName}\` = ?
         LIMIT 1`,
        [JSON.stringify(value), JSON.stringify(extra), key],
      );
    } else {
      await this.#connection.execute(
        `INSERT INTO \`${this.#tableName}\` (\`${this.#keyColumnName}\`, \`${this.#valueColumnName}\`, \`${this.#extraColumnName}\`)
         VALUES (?, ?, ?)`,
        [key, JSON.stringify(value), JSON.stringify(extra)],
      );
    }

    return { key, value, extra };
  }

  async getItem(key: Key): Promise<GetItemResult> {
    const [rows] = await this.#connection.execute<PartialItem[]>(
      `SELECT \`${this.#valueColumnName}\` AS \`value\`, \`${this.#extraColumnName}\` as \`extra\`
       FROM \`${this.#tableName}\` 
       WHERE \`${this.#keyColumnName}\` = ?
       LIMIT 1`,
      [key],
    );

    const item = rows[0];

    if (item) {
      return {
        key,
        value: item.value,
        extra: item.extra,
      };
    }
  }

  async hasItem(key: Key): Promise<boolean> {
    const [rows] = await this.#connection.execute<ItemExists[]>(
      `SELECT EXISTS (SELECT 1 FROM \`${this.#tableName}\` WHERE \`${this.#keyColumnName}\` = ?) AS item_exists`,
      [key],
    );

    const result = rows[0];

    return result?.item_exists === 1;
  }

  async removeItem(key: Key): Promise<boolean> {
    const [deleteResult] = await this.#connection.execute<ResultSetHeader>(
      `DELETE FROM \`${this.#tableName}\` WHERE \`${this.#keyColumnName}\` = ? LIMIT 1`,
      [key],
    );

    return deleteResult.affectedRows === 1;
  }

  async setExtra(key: Key, extra: Extra): Promise<SetExtraResult> {
    const itemExists = await this.hasItem(key);

    if (itemExists) {
      await this.#connection.execute(
        `UPDATE \`${this.#tableName}\`
         SET \`${this.#extraColumnName}\` = ?
         WHERE \`${this.#keyColumnName}\` = ?
         LIMIT 1`,
        [JSON.stringify(extra), key],
      );

      return extra;
    }

    return false;
  }

  async getExtra(key: Key): Promise<GetExtraResult> {
    const [rows] = await this.#connection.execute<ExtraItem[]>(
      `SELECT \`${this.#extraColumnName}\` AS \`extra\`
       FROM \`${this.#tableName}\`
       WHERE \`${this.#keyColumnName}\` = ?
       LIMIT 1`,
      [key],
    );

    const result = rows[0];

    return result?.extra;
  }
}
