import { runAdapterTests } from "@stash-it/dev-tools";
import { createConnection } from "mysql2/promise";
import { afterAll, describe, expect, it } from "vitest";

import { MYSQL_DATABASE, MYSQL_HOST, MYSQL_PORT, MYSQL_ROOT_PASSWORD, MYSQL_USER } from "./envVariables";
import { MySqlAdapter, type MySqlAdapterConfiguration, mySqlAdapterConfigurationSchema } from "./index";

const connectionConfiguration: MySqlAdapterConfiguration["connection"] = {
  host: MYSQL_HOST,
  user: MYSQL_USER,
  password: MYSQL_ROOT_PASSWORD,
  database: MYSQL_DATABASE,
  port: MYSQL_PORT,
};

const tableName = "items";
const keyColumnName = "key";
const valueColumnName = "value";
const extraColumnName = "extra";

const tableConfiguration: MySqlAdapterConfiguration["table"] = {
  tableName,
  keyColumnName,
  valueColumnName,
  extraColumnName,
};

const adapterConfiguration: MySqlAdapterConfiguration = {
  connection: connectionConfiguration,
  table: tableConfiguration,
};

const prepareDatabase = async (connectionConfiguration: MySqlAdapterConfiguration["connection"]) => {
  const db = await createConnection(connectionConfiguration);

  await db.query(`DROP TABLE IF EXISTS \`${tableName}\``);

  await db.query(
    `CREATE TABLE \`${tableName}\` (
      \`${keyColumnName}\` VARCHAR(255) PRIMARY KEY,
      \`${valueColumnName}\` JSON NOT NULL, 
      \`${extraColumnName}\` JSON NOT NULL
     )`,
  );
};

describe("mysql-adapter", async () => {
  afterAll(async () => {
    const db = await createConnection(connectionConfiguration);

    await db.query(`DROP TABLE IF EXISTS \`${tableName}\``);
  });

  describe("configuration", () => {
    describe("connection", () => {
      describe("host", () => {
        it("throws an error when host is not provided", () => {
          expect(
            () =>
              new MySqlAdapter({ connection: { ...connectionConfiguration, host: undefined as unknown as string } }),
          ).toThrowErrorMatchingSnapshot();
        });

        it("throws an error when host is empty", () => {
          expect(
            () => new MySqlAdapter({ connection: { ...connectionConfiguration, host: "" } }),
          ).toThrowErrorMatchingSnapshot();
        });
      });

      describe("user", () => {
        it("throws an error when user is not provided", () => {
          expect(
            () =>
              new MySqlAdapter({ connection: { ...connectionConfiguration, user: undefined as unknown as string } }),
          ).toThrowErrorMatchingSnapshot();
        });

        it("throws an error when user is empty", () => {
          expect(
            () => new MySqlAdapter({ connection: { ...connectionConfiguration, user: "" } }),
          ).toThrowErrorMatchingSnapshot();
        });
      });

      describe("password", () => {
        it("throws an error when password is not provided", () => {
          expect(
            () =>
              new MySqlAdapter({
                connection: { ...connectionConfiguration, password: undefined as unknown as string },
              }),
          ).toThrowErrorMatchingSnapshot();
        });

        it("throws an error when password is empty", () => {
          expect(
            () => new MySqlAdapter({ connection: { ...connectionConfiguration, password: "" } }),
          ).toThrowErrorMatchingSnapshot();
        });
      });

      describe("database", () => {
        it("throws an error when database is not provided", () => {
          expect(
            () =>
              new MySqlAdapter({
                connection: { ...connectionConfiguration, database: undefined as unknown as string },
              }),
          ).toThrowErrorMatchingSnapshot();
        });

        it("throws an error when database is empty", () => {
          expect(
            () => new MySqlAdapter({ connection: { ...connectionConfiguration, database: "" } }),
          ).toThrowErrorMatchingSnapshot();
        });
      });

      describe("port number", () => {
        it("should default to 3306 when port is not provided", () => {
          const {
            connection: { port },
          } = mySqlAdapterConfigurationSchema.parse({ connection: { ...connectionConfiguration, port: undefined } });

          expect(port).toBe(3306);
        });

        it("throws an error when port is not a number", () => {
          expect(
            () =>
              new MySqlAdapter({
                connection: { ...connectionConfiguration, port: "not_a_port_number" as unknown as number },
              }),
          ).toThrowErrorMatchingSnapshot();
        });
      });
    });

    describe("table", () => {
      it("should use default table configuration when it is not provided", () => {
        const { table } = mySqlAdapterConfigurationSchema.parse({
          ...adapterConfiguration,
          table: undefined,
        });

        expect(table).toEqual({
          tableName: "items",
          keyColumnName: "key",
          valueColumnName: "value",
          extraColumnName: "extra",
        });
      });

      describe("tableName", () => {
        it('should default to "items" if not provided', () => {
          const {
            table: { tableName },
          } = mySqlAdapterConfigurationSchema.parse({
            connection: connectionConfiguration,
            table: { tableName: undefined },
          });

          expect(tableName).toEqual("items");
        });

        it("should throw if empty", () => {
          expect(
            () => new MySqlAdapter({ ...adapterConfiguration, table: { tableName: "" } }),
          ).toThrowErrorMatchingSnapshot();
        });

        it("should throw if not a string", () => {
          expect(
            () => new MySqlAdapter({ ...adapterConfiguration, table: { tableName: 1 as unknown as string } }),
          ).toThrowErrorMatchingSnapshot();
        });
      });

      describe("keyColumnName", () => {
        it('should default to "key" if not provided', () => {
          const {
            table: { keyColumnName },
          } = mySqlAdapterConfigurationSchema.parse({
            connection: connectionConfiguration,
            table: { keyColumnName: undefined },
          });

          expect(keyColumnName).toEqual("key");
        });

        it("should throw if empty", () => {
          expect(
            () => new MySqlAdapter({ ...adapterConfiguration, table: { keyColumnName: "" } }),
          ).toThrowErrorMatchingSnapshot();
        });

        it("should throw if not a string", () => {
          expect(
            () => new MySqlAdapter({ ...adapterConfiguration, table: { keyColumnName: 1 as unknown as string } }),
          ).toThrowErrorMatchingSnapshot();
        });
      });

      describe("valueColumnName", () => {
        it('should default to "value" if not provided', () => {
          const {
            table: { valueColumnName },
          } = mySqlAdapterConfigurationSchema.parse({
            connection: connectionConfiguration,
            table: { valueColumnName: undefined },
          });

          expect(valueColumnName).toEqual("value");
        });

        it("should throw if empty", () => {
          expect(
            () => new MySqlAdapter({ ...adapterConfiguration, table: { valueColumnName: "" } }),
          ).toThrowErrorMatchingSnapshot();
        });

        it("should throw if not a string", () => {
          expect(
            () => new MySqlAdapter({ ...adapterConfiguration, table: { valueColumnName: 1 as unknown as string } }),
          ).toThrowErrorMatchingSnapshot();
        });
      });

      describe("extraColumnName", () => {
        it('should default to "extra" if not provided', () => {
          const {
            table: { extraColumnName },
          } = mySqlAdapterConfigurationSchema.parse({
            connection: connectionConfiguration,
            table: { extraColumnName: undefined },
          });

          expect(extraColumnName).toEqual("extra");
        });

        it("should throw if empty", () => {
          expect(
            () => new MySqlAdapter({ ...adapterConfiguration, table: { extraColumnName: "" } }),
          ).toThrowErrorMatchingSnapshot();
        });

        it("should throw if not a string", () => {
          expect(
            () => new MySqlAdapter({ ...adapterConfiguration, table: { extraColumnName: 1 as unknown as string } }),
          ).toThrowErrorMatchingSnapshot();
        });
      });
    });

    describe("table check", () => {
      it("should throw when table does not exist", async () => {
        const configuration: MySqlAdapterConfiguration = {
          ...adapterConfiguration,
          table: {
            ...adapterConfiguration.table,
            tableName: "non_existent_table",
          },
        };

        const adapter = new MySqlAdapter(configuration);

        await expect(adapter.checkStorage()).rejects.toThrow(
          `Table '${MYSQL_DATABASE}.non_existent_table' doesn't exist`,
        );
      });

      it("should throw when key column doesn't exist", async () => {
        const configuration: MySqlAdapterConfiguration = {
          ...adapterConfiguration,
          table: {
            ...adapterConfiguration.table,
            keyColumnName: "non_existent_key_column",
          },
        };

        const adapter = new MySqlAdapter(configuration);

        await expect(adapter.checkStorage()).rejects.toThrow("Unknown column 'non_existent_key_column' in");
      });

      it("should throw when value column doesn't exist", async () => {
        const configuration: MySqlAdapterConfiguration = {
          ...adapterConfiguration,
          table: {
            ...adapterConfiguration.table,
            valueColumnName: "non_existent_value_column",
          },
        };

        const adapter = new MySqlAdapter(configuration);

        await expect(adapter.checkStorage()).rejects.toThrow("Unknown column 'non_existent_value_column' in");
      });

      it("should throw when extra column doesn't exist", async () => {
        const configuration: MySqlAdapterConfiguration = {
          ...adapterConfiguration,
          table: {
            ...adapterConfiguration.table,
            extraColumnName: "non_existent_extra_column",
          },
        };

        const adapter = new MySqlAdapter(configuration);

        await expect(adapter.checkStorage()).rejects.toThrow("Unknown column 'non_existent_extra_column' in");
      });
    });
  });

  describe("adapter tests", async () => {
    await prepareDatabase(adapterConfiguration.connection);

    const adapter = new MySqlAdapter(adapterConfiguration);

    runAdapterTests(adapter);
  });
});
