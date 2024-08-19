import SqliteDatabase, { type Options as BetterSqlite3Options, type Database } from "better-sqlite3";

import type {
  StashItAdapterInterface,
  Extra,
  GetExtraResult,
  GetItemResult,
  Item,
  Key,
  SetExtraResult,
  Value,
} from "@stash-it/core";

/**
 * Ideas:
 * - provide a default table creation script: this.db.prepare('CREATE TABLE stash (key TEXT PRIMARY KEY, value TEXT, extra TEXT)').run();
 *    this will make sure that the table is created if it does not exist and is ready to be used and efficient
 * -
 */

// TODO add schema for this, too many checks to be done. zod
export type SqliteAdapterOptions = {
  dbPath: string;
  extraColumnName?: string;
  keyColumnName?: string;
  tableName?: string;
  valueColumnName?: string;
} & Pick<BetterSqlite3Options, "verbose" | "timeout">;

export class SqliteAdapter implements StashItAdapterInterface {
  readonly #database: Database;
  readonly #tableName: string = "items";
  readonly #keyColumnName: string = "key";
  readonly #valueColumnName: string = "value";
  readonly #extraColumnName: string = "extra";

  constructor(options: SqliteAdapterOptions) {
    const mergedOptions: SqliteAdapterOptions & Pick<BetterSqlite3Options, "fileMustExist"> = {
      ...options,
      fileMustExist: true,
    };

    this.#database = new SqliteDatabase(options.dbPath, mergedOptions);
    this.#tableName = mergedOptions.tableName || this.#tableName;
    this.#keyColumnName = mergedOptions.keyColumnName || this.#keyColumnName;
    this.#valueColumnName = mergedOptions.valueColumnName || this.#valueColumnName;
    this.#extraColumnName = mergedOptions.extraColumnName || this.#extraColumnName;

    this.#checkTable();
  }

  #checkTable() {
    this.#database
      .prepare(
        `SELECT ${this.#keyColumnName}, ${this.#valueColumnName}, ${this.#extraColumnName} FROM ${this.#tableName} LIMIT 1`,
      )
      .get();
  }

  async setItem(key: Key, value: Value, extra: Extra = {}): Promise<Item> {
    const itemExists = await this.hasItem(key);

    if (itemExists) {
      this.#database
        .prepare(
          `UPDATE ${this.#tableName}
                  SET ${this.#valueColumnName} = @value, ${this.#extraColumnName} = json_insert(@extra)
                  WHERE ${this.#keyColumnName} = @key
                  LIMIT 1`,
        )
        .run({
          key,
          value: JSON.stringify(value),
          extra: JSON.stringify(extra),
        });
    } else {
      this.#database
        .prepare(
          `INSERT INTO ${this.#tableName} (${this.#keyColumnName}, ${this.#valueColumnName}, ${this.#extraColumnName})
                VALUES (@key, json_insert(@value), json_insert(@extra))`,
        )
        .run({
          key,
          value: JSON.stringify(value),
          extra: JSON.stringify(extra),
        });
    }

    return { key, value, extra };
  }

  async getItem(key: Key): Promise<GetItemResult> {
    const item = this.#database
      .prepare<{ key: Key }, { key: string; value: string; extra: string }>(
        `SELECT ${this.#keyColumnName} AS key, ${this.#valueColumnName} AS value, ${this.#extraColumnName} AS extra
                FROM ${this.#tableName}
                WHERE ${this.#keyColumnName} = @key`,
      )
      .get({ key });

    if (item) {
      return {
        key,
        value: JSON.parse(item.value),
        extra: JSON.parse(item.extra),
      };
    }
  }

  async hasItem(key: Key): Promise<boolean> {
    const result = this.#database
      .prepare<
        { key: Key },
        1 | 0
      >(`SELECT EXISTS(SELECT 1 FROM ${this.#tableName} WHERE ${this.#keyColumnName} = @key LIMIT 1)`)
      .pluck()
      .get({ key });

    return result === 1;
  }

  async removeItem(key: Key): Promise<boolean> {
    const result = this.#database
      .prepare(`DELETE FROM ${this.#tableName} WHERE ${this.#keyColumnName} = ? LIMIT 1`)
      .run(key);

    return result.changes === 1;
  }

  async setExtra(key: Key, extra: Extra): Promise<SetExtraResult> {
    const itemExists = await this.hasItem(key);

    if (itemExists) {
      this.#database
        .prepare(
          `UPDATE ${this.#tableName}
                  SET ${this.#extraColumnName} = json_insert(@extra)
                  WHERE ${this.#keyColumnName} = @key`,
        )
        .run({ key, extra: JSON.stringify(extra) });

      return extra;
    }

    return false;
  }

  async getExtra(key: Key): Promise<GetExtraResult> {
    const result = this.#database
      .prepare<
        { key: Key },
        string
      >(`SELECT ${this.#extraColumnName} AS extra FROM ${this.#tableName} WHERE ${this.#keyColumnName} = @key`)
      .pluck()
      .get({ key });

    if (!result) {
      return undefined;
    }

    return JSON.parse(result);
  }
}
