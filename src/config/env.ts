import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  API_SECRET_KEY: z.string().default('vinta3_default_secret_key'),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  DEFAULT_MODEL_PROVIDER: z.enum(['openai', 'anthropic', 'gemini', 'ollama', 'mock']).default('mock'),
  DEFAULT_MODEL_NAME: z.string().default('gpt-4o'),
  VECTOR_DB_PATH: z.string().default('./data/vinta3_vector_store.json'),
  MEMORY_WINDOW_SIZE: z.string().transform(Number).default('30'),
  ENABLE_SEMANTIC_MEMORY: z.string().transform((v) => v === 'true').default('true'),
  MAX_ITERATIONS: z.string().transform(Number).default('15'),
  STEP_TIMEOUT_MS: z.string().transform(Number).default('30000'),
  SANDBOX_ENABLED: z.string().transform((v) => v === 'true').default('true'),
  CIRCUIT_BREAKER_THRESHOLD: z.string().transform(Number).default('3'),
});

export const config = envSchema.parse(process.env);
