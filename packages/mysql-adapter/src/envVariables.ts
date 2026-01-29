import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envVariablesSchema = z.object({
  MYSQL_CONTAINER_NAME: z.string(),
  MYSQL_HOST: z.string(),
  MYSQL_DATABASE: z.string(),
  MYSQL_USER: z.string(),
  MYSQL_ROOT_PASSWORD: z.string(),
  MYSQL_PORT: z.string().transform(Number),
});

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envVariablesSchema> {}
  }
}

export const { MYSQL_CONTAINER_NAME, MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, MYSQL_ROOT_PASSWORD, MYSQL_PORT } =
  envVariablesSchema.parse(process.env);
