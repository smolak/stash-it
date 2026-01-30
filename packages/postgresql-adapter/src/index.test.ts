import { runAdapterTests } from "@stash-it/dev-tools";
import { Client } from "pg";
import { afterAll, describe, expect, it } from "vitest";
import { postgreSqlAdapterConfigurationSchema } from "./_schema";
import { POSTGRES_DATABASE, POSTGRES_HOST, POSTGRES_PASSWORD, POSTGRES_PORT, POSTGRES_USER } from "./envVariables";
import { PostgreSqlAdapter, type PostgreSqlAdapterConfiguration } from "./index";

const connectionConfiguration: PostgreSqlAdapterConfiguration["connection"] = {
  host: POSTGRES_HOST,
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DATABASE,
  port: POSTGRES_PORT,
};

const tableName = "items";
const keyColumnName = "key";
const valueColumnName = "value";
const extraColumnName = "extra";

const tableConfiguration: PostgreSqlAdapterConfiguration["table"] = {
  tableName,
  keyColumnName,
  valueColumnName,
  extraColumnName,
};

const adapterConfiguration: PostgreSqlAdapterConfiguration = {
  connection: connectionConfiguration,
  table: tableConfiguration,
};

const prepareDatabase = async (configuration: PostgreSqlAdapterConfiguration) => {
  const client = new Client(configuration.connection);

  await client.connect();

  await client.query(`DROP TABLE IF EXISTS "${tableName}"`);

  await client.query(
    `CREATE TABLE "${tableName}" (
      "${keyColumnName}" TEXT PRIMARY KEY,
      "${valueColumnName}" JSONB NOT NULL, 
      "${extraColumnName}" JSONB NOT NULL
     )`,
  );

  await client.end();
};

describe("PostgreSqlAdapter", async () => {
  afterAll(async () => {
    const client = new Client(adapterConfiguration.connection);

    await client.connect();
    await client.query(`DROP TABLE IF EXISTS "${tableName}"`);
    await client.end();
  });

  describe("configuration", () => {
    describe("connection", () => {
      describe("host", () => {
        it("throws an error when host is not provided", () => {
          expect(
            () =>
              new PostgreSqlAdapter({
                connection: { ...connectionConfiguration, host: undefined as unknown as string },
              }),
          ).toThrowErrorMatchingSnapshot();
        });

        it("throws an error when host is empty", () => {
          expect(
            () => new PostgreSqlAdapter({ connection: { ...connectionConfiguration, host: "" } }),
          ).toThrowErrorMatchingSnapshot();
        });
      });

      describe("user", () => {
        it("throws an error when user is not provided", () => {
          expect(
            () =>
              new PostgreSqlAdapter({
                connection: { ...connectionConfiguration, user: undefined as unknown as string },
              }),
          ).toThrowErrorMatchingSnapshot();
        });

        it("throws an error when user is empty", () => {
          expect(
            () => new PostgreSqlAdapter({ connection: { ...connectionConfiguration, user: "" } }),
          ).toThrowErrorMatchingSnapshot();
        });
      });

      describe("password", () => {
        it("throws an error when password is not provided", () => {
          expect(
            () =>
              new PostgreSqlAdapter({
                connection: { ...connectionConfiguration, password: undefined as unknown as string },
              }),
          ).toThrowErrorMatchingSnapshot();
        });

        it("throws an error when password is empty", () => {
          expect(
            () => new PostgreSqlAdapter({ connection: { ...connectionConfiguration, password: "" } }),
          ).toThrowErrorMatchingSnapshot();
        });
      });

      describe("database", () => {
        it("throws an error when database is not provided", () => {
          expect(
            () =>
              new PostgreSqlAdapter({
                connection: { ...connectionConfiguration, database: undefined as unknown as string },
              }),
          ).toThrowErrorMatchingSnapshot();
        });

        it("throws an error when database is empty", () => {
          expect(
            () => new PostgreSqlAdapter({ connection: { ...connectionConfiguration, database: "" } }),
          ).toThrowErrorMatchingSnapshot();
        });
      });

      describe("port number", () => {
        it("should default to 5432 when port is not provided", () => {
          const {
            connection: { port },
          } = postgreSqlAdapterConfigurationSchema.parse({
            connection: { ...connectionConfiguration, port: undefined },
          });

          expect(port).toBe(5432);
        });

        it("throws an error when port is not a number", () => {
          expect(
            () =>
              new PostgreSqlAdapter({
                connection: { ...connectionConfiguration, port: "not_a_port_number" as unknown as number },
              }),
          ).toThrowErrorMatchingSnapshot();
        });
      });
    });

    describe("table", () => {
      it("should use default table configuration when it is not provided", () => {
        const { table } = postgreSqlAdapterConfigurationSchema.parse({
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
          } = postgreSqlAdapterConfigurationSchema.parse({
            connection: connectionConfiguration,
            table: { tableName: undefined },
          });

          expect(tableName).toEqual("items");
        });

        it("should throw if empty", () => {
          expect(
            () => new PostgreSqlAdapter({ ...adapterConfiguration, table: { tableName: "" } }),
          ).toThrowErrorMatchingSnapshot();
        });

        it("should throw if not a string", () => {
          expect(
            () => new PostgreSqlAdapter({ ...adapterConfiguration, table: { tableName: 1 as unknown as string } }),
          ).toThrowErrorMatchingSnapshot();
        });
      });

      describe("keyColumnName", () => {
        it('should default to "key" if not provided', () => {
          const {
            table: { keyColumnName },
          } = postgreSqlAdapterConfigurationSchema.parse({
            connection: connectionConfiguration,
            table: { keyColumnName: undefined },
          });

          expect(keyColumnName).toEqual("key");
        });

        it("should throw if empty", () => {
          expect(
            () => new PostgreSqlAdapter({ ...adapterConfiguration, table: { keyColumnName: "" } }),
          ).toThrowErrorMatchingSnapshot();
        });

        it("should throw if not a string", () => {
          expect(
            () => new PostgreSqlAdapter({ ...adapterConfiguration, table: { keyColumnName: 1 as unknown as string } }),
          ).toThrowErrorMatchingSnapshot();
        });
      });

      describe("valueColumnName", () => {
        it('should default to "value" if not provided', () => {
          const {
            table: { valueColumnName },
          } = postgreSqlAdapterConfigurationSchema.parse({
            connection: connectionConfiguration,
            table: { valueColumnName: undefined },
          });

          expect(valueColumnName).toEqual("value");
        });

        it("should throw if empty", () => {
          expect(
            () => new PostgreSqlAdapter({ ...adapterConfiguration, table: { valueColumnName: "" } }),
          ).toThrowErrorMatchingSnapshot();
        });

        it("should throw if not a string", () => {
          expect(
            () =>
              new PostgreSqlAdapter({ ...adapterConfiguration, table: { valueColumnName: 1 as unknown as string } }),
          ).toThrowErrorMatchingSnapshot();
        });
      });

      describe("extraColumnName", () => {
        it('should default to "extra" if not provided', () => {
          const {
            table: { extraColumnName },
          } = postgreSqlAdapterConfigurationSchema.parse({
            connection: connectionConfiguration,
            table: { extraColumnName: undefined },
          });

          expect(extraColumnName).toEqual("extra");
        });

        it("should throw if empty", () => {
          expect(
            () => new PostgreSqlAdapter({ ...adapterConfiguration, table: { extraColumnName: "" } }),
          ).toThrowErrorMatchingSnapshot();
        });

        it("should throw if not a string", () => {
          expect(
            () =>
              new PostgreSqlAdapter({ ...adapterConfiguration, table: { extraColumnName: 1 as unknown as string } }),
          ).toThrowErrorMatchingSnapshot();
        });
      });
    });

    describe("table check", () => {
      it("should throw when table does not exist", async () => {
        const configuration: PostgreSqlAdapterConfiguration = {
          ...adapterConfiguration,
          table: {
            ...adapterConfiguration.table,
            tableName: "non_existent_table",
          },
        };

        const adapter = new PostgreSqlAdapter(configuration);

        await expect(adapter.checkStorage()).rejects.toThrow('relation "non_existent_table" does not exist');
      });

      it("should throw when key column doesn't exist", async () => {
        const configuration: PostgreSqlAdapterConfiguration = {
          ...adapterConfiguration,
          table: {
            ...adapterConfiguration.table,
            keyColumnName: "non_existent_key_column",
          },
        };

        const adapter = new PostgreSqlAdapter(configuration);

        await expect(adapter.checkStorage()).rejects.toThrow('column "non_existent_key_column" does not exist');
      });

      it("should throw when value column doesn't exist", async () => {
        const configuration: PostgreSqlAdapterConfiguration = {
          ...adapterConfiguration,
          table: {
            ...adapterConfiguration.table,
            valueColumnName: "non_existent_value_column",
          },
        };

        const adapter = new PostgreSqlAdapter(configuration);

        await expect(adapter.checkStorage()).rejects.toThrow(
          'column "non_existent_value_column" of relation "items" does not exist',
        );
      });

      it("should throw when extra column doesn't exist", async () => {
        const configuration: PostgreSqlAdapterConfiguration = {
          ...adapterConfiguration,
          table: {
            ...adapterConfiguration.table,
            extraColumnName: "non_existent_extra_column",
          },
        };

        const adapter = new PostgreSqlAdapter(configuration);

        await expect(adapter.checkStorage()).rejects.toThrow(
          'non_existent_extra_column" of relation "items" does not exist',
        );
      });
    });
  });

  await prepareDatabase(adapterConfiguration);

  const adapter = new PostgreSqlAdapter(adapterConfiguration);

  runAdapterTests(adapter);
});
