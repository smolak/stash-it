import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

interface RedisEnvVariables {
  REDIS_CONTAINER_NAME: string;
  REDIS_HOST: string;
  REDIS_PORT: string;
}

const envVariablesSchema: z.ZodType<RedisEnvVariables> = z.object({
  REDIS_CONTAINER_NAME: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string(),
});

declare global {
  namespace NodeJS {
    interface ProcessEnv extends RedisEnvVariables {}
  }
}

const _parsed: RedisEnvVariables = envVariablesSchema.parse(process.env);

export const REDIS_CONTAINER_NAME: string = _parsed.REDIS_CONTAINER_NAME;
export const REDIS_HOST: string = _parsed.REDIS_HOST;
export const REDIS_PORT: string = _parsed.REDIS_PORT;
