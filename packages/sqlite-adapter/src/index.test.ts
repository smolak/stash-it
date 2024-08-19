import fs from "fs-extra";
import path from "path";
import { it, expect, afterAll, describe } from "vitest";
import SqliteDatabase from "better-sqlite3";
import { nanoid } from "nanoid";
import { runAdapterTests } from "@stash-it/dev-tools";

import { SqliteAdapter, type SqliteAdapterOptions } from "./index";

const tempDir = path.join(__dirname, "..", "temp");
const tableName = "items";
const keyColumnName = "key";
const valueColumnName = "value";
const extraColumnName = "extra";

let adapter: SqliteAdapter;

const dbName = `testdb_${nanoid()}.db`;
const dbPath = path.join(tempDir, dbName);

const createAdapter = (options: Partial<SqliteAdapterOptions> = {}) => {
  const db = new SqliteDatabase(dbPath);

  db.prepare(
    `CREATE TABLE ${tableName} (${keyColumnName} TEXT PRIMARY KEY, ${valueColumnName} TEXT, ${extraColumnName} TEXT)`,
  ).run();

  return new SqliteAdapter({ ...options, dbPath });
};

fs.removeSync(tempDir);
fs.ensureDirSync(tempDir);

adapter = createAdapter();

describe("sqlite-adapter", () => {
  afterAll(() => {
    fs.removeSync(tempDir);
  });

  describe("validation", () => {
    it("should throw when db file does not exist", () => {
      expect(() => new SqliteAdapter({ dbPath: "./non-existent.db" })).to.throw("unable to open database file");
    });

    it("should throw when table does not exist", () => {
      expect(() => new SqliteAdapter({ dbPath, tableName: "non_existent_table" })).to.toThrowError(
        "no such table: non_existent_table",
      );
    });

    it("should throw when key column doesn't exist", () => {
      expect(() => new SqliteAdapter({ dbPath, keyColumnName: "non_existent_key_column" })).to.toThrowError(
        "no such column: non_existent_key_column",
      );
    });

    it("should throw when value column doesn't exist", () => {
      expect(() => new SqliteAdapter({ dbPath, valueColumnName: "non_existent_value_column" })).to.toThrowError(
        "no such column: non_existent_value_column",
      );
    });

    it("should throw when extra column doesn't exist", () => {
      expect(() => new SqliteAdapter({ dbPath, extraColumnName: "non_existent_extra_column" })).to.toThrowError(
        "no such column: non_existent_extra_column",
      );
    });

    it("should not throw when validation passes", () => {
      expect(() => new SqliteAdapter({ dbPath })).not.toThrow();
    });
  });

  runAdapterTests(adapter);
});
