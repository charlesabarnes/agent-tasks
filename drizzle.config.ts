import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './agent-tasks/src/drizzle/migrations',
  schema: './agent-tasks/src/drizzle/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

