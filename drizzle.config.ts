import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './spartan-drizzle/src/drizzle/migrations',
  schema: './spartan-drizzle/src/drizzle/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

