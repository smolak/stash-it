import { z } from "zod";

interface PostgreSqlConnectionConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
}

interface PostgreSqlTableConfig {
  tableName: string;
  keyColumnName: string;
  valueColumnName: string;
  extraColumnName: string;
}

interface PostgreSqlAdapterConfig {
  connection: PostgreSqlConnectionConfig;
  table: PostgreSqlTableConfig;
}

export const postgreSqlAdapterConfigurationSchema: z.ZodType<PostgreSqlAdapterConfig> = z.object({
  connection: z.object({
    host: z.string().trim().min(1),
    user: z.string().trim().min(1),
    password: z.string().min(1),
    database: z.string().trim().min(1),
    port: z.number().default(5432),
  }),
  table: z
    .object({
      tableName: z.string().trim().min(1).default("items"),
      keyColumnName: z.string().trim().min(1).default("key"),
      valueColumnName: z.string().trim().min(1).default("value"),
      extraColumnName: z.string().trim().min(1).default("extra"),
    })
    .default({
      tableName: "items",
      keyColumnName: "key",
      valueColumnName: "value",
      extraColumnName: "extra",
    }),
});
