import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envVariablesSchema = z.object({
  POSTGRES_CONTAINER_NAME: z.string(),
  POSTGRES_HOST: z.string(),
  POSTGRES_DATABASE: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_PORT: z.string().transform(Number),
});

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envVariablesSchema> {}
  }
}

export const {
  POSTGRES_CONTAINER_NAME,
  POSTGRES_HOST,
  POSTGRES_DATABASE,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_PORT,
} = envVariablesSchema.parse(process.env);
