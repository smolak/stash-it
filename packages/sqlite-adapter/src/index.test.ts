import { createHmac } from "node:crypto";
import path from "node:path";
import { runAdapterTests } from "@stash-it/dev-tools";
import SqliteDatabase from "better-sqlite3";
import fs from "fs-extra";
import { afterAll, describe, expect, it } from "vitest";

import { SqliteAdapter, type SqliteAdapterConfiguration } from "./index";

const generateRandomString = () => createHmac("sha256", "stash-it").digest("hex");

const tempDir = path.join(__dirname, "..", "temp");
const tableName = "items";
const keyColumnName = "key";
const valueColumnName = "value";
const extraColumnName = "extra";

const dbName = `testdb_${generateRandomString()}.db`;
const dbPath = path.join(tempDir, dbName);

const adapterConfiguration: SqliteAdapterConfiguration = {
  connection: {
    dbPath,
  },
  table: {
    tableName,
    keyColumnName,
    valueColumnName,
    extraColumnName,
  },
};

const prepareDb = () => {
  fs.removeSync(tempDir);
  fs.ensureDirSync(tempDir);

  const db = new SqliteDatabase(dbPath);

  db.prepare(
    `CREATE TABLE "${tableName}" ("${keyColumnName}" TEXT PRIMARY KEY, "${valueColumnName}" TEXT, "${extraColumnName}" TEXT)`,
  ).run();
};

prepareDb();

describe("sqlite-adapter", () => {
  afterAll(() => {
    fs.removeSync(tempDir);
  });

  describe("configuration", () => {
    describe("validation", () => {
      it("should throw when db file does not exist", () => {
        expect(() => new SqliteAdapter({ connection: { dbPath: "./non-existent.db" } })).to.throw(
          "unable to open database file",
        );
      });

      describe("optional configuration", () => {
        describe("tableName", () => {
          it("should throw if passed value is not a string", () => {
            expect(
              () => new SqliteAdapter({ ...adapterConfiguration, table: { tableName: 1 as unknown as string } }),
            ).toThrow(
              expect.objectContaining({ message: expect.stringContaining("Expected string, received number") }),
            );
          });
        });

        describe("keyColumnName", () => {
          it("should throw if passed value is not a string", () => {
            expect(
              () => new SqliteAdapter({ ...adapterConfiguration, table: { keyColumnName: 1 as unknown as string } }),
            ).toThrow(
              expect.objectContaining({ message: expect.stringContaining("Expected string, received number") }),
            );
          });
        });

        describe("valueColumnName", () => {
          it("should throw if passed value is not a string", () => {
            expect(
              () => new SqliteAdapter({ ...adapterConfiguration, table: { valueColumnName: 1 as unknown as string } }),
            ).toThrow(
              expect.objectContaining({ message: expect.stringContaining("Expected string, received number") }),
            );
          });
        });

        describe("extraColumnName", () => {
          it("should throw if passed value is not a string", () => {
            expect(
              () => new SqliteAdapter({ ...adapterConfiguration, table: { extraColumnName: 1 as unknown as string } }),
            ).toThrow(
              expect.objectContaining({ message: expect.stringContaining("Expected string, received number") }),
            );
          });
        });
      });
    });

    describe("table check", () => {
      it("should throw when table does not exist", async () => {
        const configuration: SqliteAdapterConfiguration = {
          ...adapterConfiguration,
          table: { ...adapterConfiguration.table, tableName: "non_existent_table" },
        };

        const adapter = new SqliteAdapter(configuration);

        await expect(adapter.checkStorage()).rejects.toThrow("no such table: non_existent_table");
      });

      it("should throw when key column doesn't exist", async () => {
        const configuration: SqliteAdapterConfiguration = {
          ...adapterConfiguration,
          table: { ...adapterConfiguration.table, keyColumnName: "non_existent_key_column" },
        };

        const adapter = new SqliteAdapter(configuration);

        await expect(adapter.checkStorage()).rejects.toThrow('no such column: "non_existent_key_column"');
      });

      it("should throw when value column doesn't exist", async () => {
        const configuration: SqliteAdapterConfiguration = {
          ...adapterConfiguration,
          table: { ...adapterConfiguration.table, valueColumnName: "non_existent_value_column" },
        };

        const adapter = new SqliteAdapter(configuration);

        await expect(adapter.checkStorage()).rejects.toThrow(
          "table items has no column named non_existent_value_column",
        );
      });

      it("should throw when extra column doesn't exist", async () => {
        const configuration: SqliteAdapterConfiguration = {
          ...adapterConfiguration,
          table: { ...adapterConfiguration.table, extraColumnName: "non_existent_extra_column" },
        };

        const adapter = new SqliteAdapter(configuration);

        await expect(adapter.checkStorage()).rejects.toThrow(
          "table items has no column named non_existent_extra_column",
        );
      });
    });
  });

  const adapter = new SqliteAdapter(adapterConfiguration);

  runAdapterTests(adapter);
});
