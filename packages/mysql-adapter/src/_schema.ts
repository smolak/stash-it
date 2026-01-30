import { z } from "zod";

interface MySqlConnectionConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
}

interface MySqlTableConfig {
  tableName: string;
  keyColumnName: string;
  valueColumnName: string;
  extraColumnName: string;
}

interface MySqlAdapterConfig {
  connection: MySqlConnectionConfig;
  table: MySqlTableConfig;
}

export const mySqlAdapterConfigurationSchema: z.ZodType<MySqlAdapterConfig> = z.object({
  connection: z.object({
    host: z.string().trim().min(1),
    user: z.string().trim().min(1),
    password: z.string().min(1),
    database: z.string().trim().min(1),
    port: z.number().default(3306),
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
