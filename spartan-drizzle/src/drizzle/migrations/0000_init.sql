CREATE TABLE "note" (
	"id" serial PRIMARY KEY NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
