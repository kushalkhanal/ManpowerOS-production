import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const csvList = z
  .string()
  .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean))
  .pipe(z.array(z.string().min(1)));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  JWT_SECRET: isProduction
    ? z.string().min(32, 'JWT_SECRET must be at least 32 chars in production')
    : z.string().min(1).default('manpoweros_dev_secret_NOT_FOR_PRODUCTION'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  MONGODB_URI: isProduction
    ? z.string().url()
    : z.string().url().default('mongodb://localhost:27017/manpoweros'),

  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE: z.coerce.number().int().positive().default(10 * 1024 * 1024),

  CORS_ORIGINS: csvList.default('http://localhost:5173,http://localhost:3000'),
  CLIENT_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  throw new Error('FATAL: environment validation failed');
}

const env = parsed.data;

export const config = Object.freeze({
  port: env.PORT,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  mongodbUri: env.MONGODB_URI,
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  uploadDir: env.UPLOAD_DIR,
  maxFileSize: env.MAX_FILE_SIZE,
  corsOrigins: env.CORS_ORIGINS,
  clientUrl: env.CLIENT_URL,
});
