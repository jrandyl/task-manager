CREATE TABLE "tasks" (
  "id" uuid UNIQUE PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "title" text NOT NULL,
  "description" text NOT NULL,
  "completed" boolean NOT NULL DEFAULT (false),
  "updated_at" timestamptz NOT NULL DEFAULT (now()),
  "created_at" timestamptz NOT NULL DEFAULT (now())
);
