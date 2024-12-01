import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envVariablesSchema = z.object({
  REDIS_CONTAINER_NAME: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string(),
});

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envVariablesSchema> {}
  }
}

export const { REDIS_CONTAINER_NAME, REDIS_HOST, REDIS_PORT } = envVariablesSchema.parse(process.env);
