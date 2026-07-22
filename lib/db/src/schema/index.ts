import { pgTable, text, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";

export const reviewsTable = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  movieId: integer("movie_id").notNull(),
  movieTitle: text("movie_title").notNull(),
  moviePosterPath: text("movie_poster_path").notNull(),
  reviewerName: text("reviewer_name").notNull(),
  rating: integer("rating").notNull(), // 1 to 10
  text: text("text").notNull(),
  isSpoiler: boolean("is_spoiler").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  downvotes: integer("downvotes").default(0).notNull(),
});

export type Review = typeof reviewsTable.$inferSelect;
export type InsertReview = typeof reviewsTable.$inferInsert;

export const favoritesTable = pgTable("favorites", {
  id: uuid("id").defaultRandom().primaryKey(),
  movieId: integer("movie_id").notNull(),
  movieTitle: text("movie_title").notNull(),
  posterPath: text("poster_path").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Favorite = typeof favoritesTable.$inferSelect;
export type InsertFavorite = typeof favoritesTable.$inferInsert;