import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  API_SECRET_KEY: z.string().default('vinta_default_secret_key'),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  DEFAULT_MODEL_PROVIDER: z.enum(['openai', 'anthropic', 'ollama', 'mock']).default('openai'),
  DEFAULT_MODEL_NAME: z.string().default('gpt-4o'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  VECTOR_DB_PATH: z.string().default('./data/vector_store.json'),
  MEMORY_WINDOW_SIZE: z.string().transform(Number).default('25'),
  ENABLE_SEMANTIC_MEMORY: z.string().transform((v) => v === 'true').default('true'),
  MAX_ITERATIONS: z.string().transform(Number).default('12'),
  STEP_TIMEOUT_MS: z.string().transform(Number).default('30000'),
  SANDBOX_ENABLED: z.string().transform((v) => v === 'true').default('true'),
});

export const config = envSchema.parse(process.env);
