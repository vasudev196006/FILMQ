import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function runMigrations() {
  try {
    logger.info("Running automatic DB schema alignment...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        movie_id INTEGER NOT NULL,
        movie_title TEXT NOT NULL,
        movie_poster_path TEXT NOT NULL,
        reviewer_name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        text TEXT NOT NULL,
        is_spoiler BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        upvotes INTEGER NOT NULL DEFAULT 0,
        downvotes INTEGER NOT NULL DEFAULT 0
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS favorites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        movie_id INTEGER NOT NULL,
        movie_title TEXT NOT NULL,
        poster_path TEXT NOT NULL,
        release_date TEXT NOT NULL DEFAULT '',
        vote_average TEXT NOT NULL DEFAULT '0',
        genres TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    await db.execute(sql`ALTER TABLE favorites ADD COLUMN IF NOT EXISTS release_date TEXT DEFAULT ''`);
    await db.execute(sql`ALTER TABLE favorites ADD COLUMN IF NOT EXISTS vote_average TEXT DEFAULT '0'`);
    await db.execute(sql`ALTER TABLE favorites ADD COLUMN IF NOT EXISTS genres TEXT DEFAULT ''`);
    logger.info("Automatic DB schema alignment completed successfully.");
  } catch (err) {
    logger.error({ err }, "Failed to run automatic DB schema alignment");
  }
}

runMigrations().then(() => {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
});
