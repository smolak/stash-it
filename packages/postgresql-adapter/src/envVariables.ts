import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

interface PostgresEnvVariables {
  POSTGRES_CONTAINER_NAME: string;
  POSTGRES_HOST: string;
  POSTGRES_DATABASE: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_PORT: number;
}

const envVariablesSchema: z.ZodType<PostgresEnvVariables> = z.object({
  POSTGRES_CONTAINER_NAME: z.string(),
  POSTGRES_HOST: z.string(),
  POSTGRES_DATABASE: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_PORT: z.string().transform(Number),
});

declare global {
  namespace NodeJS {
    interface ProcessEnv extends PostgresEnvVariables {}
  }
}

const _parsed: PostgresEnvVariables = envVariablesSchema.parse(process.env);

export const POSTGRES_CONTAINER_NAME: string = _parsed.POSTGRES_CONTAINER_NAME;
export const POSTGRES_HOST: string = _parsed.POSTGRES_HOST;
export const POSTGRES_DATABASE: string = _parsed.POSTGRES_DATABASE;
export const POSTGRES_USER: string = _parsed.POSTGRES_USER;
export const POSTGRES_PASSWORD: string = _parsed.POSTGRES_PASSWORD;
export const POSTGRES_PORT: number = _parsed.POSTGRES_PORT;
