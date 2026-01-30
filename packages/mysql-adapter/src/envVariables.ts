import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

interface MySqlEnvVariables {
  MYSQL_CONTAINER_NAME: string;
  MYSQL_HOST: string;
  MYSQL_DATABASE: string;
  MYSQL_USER: string;
  MYSQL_ROOT_PASSWORD: string;
  MYSQL_PORT: number;
}

const envVariablesSchema: z.ZodType<MySqlEnvVariables> = z.object({
  MYSQL_CONTAINER_NAME: z.string(),
  MYSQL_HOST: z.string(),
  MYSQL_DATABASE: z.string(),
  MYSQL_USER: z.string(),
  MYSQL_ROOT_PASSWORD: z.string(),
  MYSQL_PORT: z.string().transform(Number),
});

declare global {
  namespace NodeJS {
    interface ProcessEnv extends MySqlEnvVariables {}
  }
}

const _parsed: MySqlEnvVariables = envVariablesSchema.parse(process.env);

export const MYSQL_CONTAINER_NAME: string = _parsed.MYSQL_CONTAINER_NAME;
export const MYSQL_HOST: string = _parsed.MYSQL_HOST;
export const MYSQL_DATABASE: string = _parsed.MYSQL_DATABASE;
export const MYSQL_USER: string = _parsed.MYSQL_USER;
export const MYSQL_ROOT_PASSWORD: string = _parsed.MYSQL_ROOT_PASSWORD;
export const MYSQL_PORT: number = _parsed.MYSQL_PORT;
