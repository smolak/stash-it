import fs from "fs-extra";
import path from "path";
import { it, expect, afterAll, beforeAll, describe, beforeEach } from "vitest";
import SqliteDatabase from "better-sqlite3";

import { SqliteAdapter, type SqliteAdapterOptions } from "./index";

const tempDir = path.join(__dirname, "..", "temp");
const tableName = "items";
const keyColumnName = "key";
const valueColumnName = "value";
const extraColumnName = "extra";

let dbId = Date.now();

const testDatabases = {
  current: () => {
    const dbName = `testdb_${dbId++}.db`;
    const dbPath = path.join(tempDir, dbName);

    const db = new SqliteDatabase(dbPath);
    db.prepare(
      `CREATE TABLE ${tableName} (${keyColumnName} TEXT PRIMARY KEY, ${valueColumnName} TEXT, ${extraColumnName} JSON)`,
    ).run();

    return { dbName, dbPath };
  },
  next: () => {
    dbId++;

    return testDatabases.current();
  },
};

const createAdapter = (options: Partial<SqliteAdapterOptions> = {}) => {
  const { dbPath } = testDatabases.current();

  return new SqliteAdapter({ ...options, dbPath });
};

describe("sqlite-adapter", () => {
  beforeAll(() => {
    fs.removeSync(tempDir);
    fs.ensureDirSync(tempDir);
  });

  afterAll(() => {
    fs.removeSync(tempDir);
  });

  beforeEach(() => {
    testDatabases.next();
  });

  describe("validation", () => {
    it("should throw when db file does not exist", () => {
      expect(() => new SqliteAdapter({ dbPath: "./non-existent.db" })).to.throw("unable to open database file");
    });

    it("should throw when table does not exist", () => {
      const { dbPath } = testDatabases.current();

      expect(() => new SqliteAdapter({ dbPath, tableName: "non_existent_table" })).to.toThrowError(
        "no such table: non_existent_table",
      );
    });

    it("should throw when key column doesn't exist", () => {
      const { dbPath } = testDatabases.current();

      expect(() => new SqliteAdapter({ dbPath, keyColumnName: "non_existent_key_column" })).to.toThrowError(
        "no such column: non_existent_key_column",
      );
    });

    it("should throw when value column doesn't exist", () => {
      const { dbPath } = testDatabases.current();

      expect(() => new SqliteAdapter({ dbPath, valueColumnName: "non_existent_value_column" })).to.toThrowError(
        "no such column: non_existent_value_column",
      );
    });

    it("should throw when extra column doesn't exist", () => {
      const { dbPath } = testDatabases.current();

      expect(() => new SqliteAdapter({ dbPath, extraColumnName: "non_existent_extra_column" })).to.toThrowError(
        "no such column: non_existent_extra_column",
      );
    });

    it("should not throw when validation passes", () => {
      expect(() => new SqliteAdapter({ dbPath: testDatabases.current().dbPath })).not.toThrow();
    });
  });

  describe("setting and getting an item", () => {
    it("should be able to get an existing item", async () => {
      const adapter = createAdapter();
      const key = "key";
      const value = "value";
      const extra = { foo: "bar" };

      await adapter.setItem(key, value, extra);

      const item = await adapter.getItem(key);

      expect(item).toEqual({ key, value, extra });
    });

    it("should return undefined when item does not exist", async () => {
      const adapter = createAdapter();

      const item = await adapter.getItem("non-existing-key");

      expect(item).toBeUndefined();
    });

    it("setting an item for existing key should overwrite the existing item", async () => {
      const adapter = createAdapter();
      const key = "key";
      const value = "value";
      const extra = { foo: "bar" };

      await adapter.setItem(key, value, extra);

      const newValue = "new value";
      const newExtra = { foo: "baz" };

      await adapter.setItem(key, newValue, newExtra);

      const item = await adapter.getItem(key);

      expect(item).toEqual({ key, value: newValue, extra: newExtra });
    });
  });

  describe("setting and getting extra", () => {
    it("should be able to set extra for an existing item", async () => {
      const adapter = createAdapter();
      const key = "key";
      const value = "value";

      await adapter.setItem(key, value);

      const extra = { foo: "bar" };

      await adapter.setExtra(key, extra);

      const extraSetOnItem = await adapter.getExtra(key);

      expect(extraSetOnItem).toEqual(extra);
    });

    it("should not be able to set extra on non-existing item", async () => {
      const adapter = createAdapter();
      const key = "non-existing-key";
      const extra = { foo: "bar" };

      const result = await adapter.setExtra(key, extra);

      expect(result).toBe(false);
    });

    it("setting extra should overwrite the existing extra", async () => {
      const adapter = createAdapter();
      const key = "key";
      const value = "value";
      const extra = { foo: "bar" };

      await adapter.setItem(key, value, extra);

      const newExtra = { baz: "bam" };

      await adapter.setExtra(key, newExtra);

      const extraSetOnItem = await adapter.getExtra(key);

      expect(extraSetOnItem).toEqual(newExtra);
    });
  });

  describe("removing an item", () => {
    it("should be able to remove an existing item", async () => {
      const adapter = createAdapter();
      const key = "key";
      const value = "value";

      await adapter.setItem(key, value);

      const check = await adapter.hasItem(key);
      expect(check).toBe(true);

      await adapter.removeItem(key);

      const checkAgain = await adapter.hasItem(key);

      expect(checkAgain).toBe(false);
    });

    it("should return false when trying to remove non-existing item", async () => {
      const adapter = createAdapter();

      const result = await adapter.removeItem("non-existing-key");

      expect(result).toBe(false);
    });
  });

  describe("checking if item exists", () => {
    it("should return true for existing item", async () => {
      const adapter = createAdapter();
      const key = "key";
      const value = "value";

      await adapter.setItem(key, value);

      const check = await adapter.hasItem(key);

      expect(check).toBe(true);
    });

    it("should return false for non-existing item", async () => {
      const adapter = createAdapter();

      const check = await adapter.hasItem("non-existing-key");

      expect(check).toBe(false);
    });
  });

  describe("removing an item", () => {
    it("should return true when removing an existing item", async () => {
      const adapter = createAdapter();
      const key = "key";
      const value = "value";

      await adapter.setItem(key, value);

      const result = await adapter.removeItem(key);

      expect(result).toBe(true);
    });

    it("should return false when removing non-existing item", async () => {
      const adapter = createAdapter();

      const result = await adapter.removeItem("non-existing-key");

      expect(result).toBe(false);
    });
  });
});
