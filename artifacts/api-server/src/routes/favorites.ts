import { Router } from "express";
import { db, favoritesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

// GET /api/favorites - Get all favorites
router.get("/favorites", async (req, res, next) => {
  try {
    const data = await db.select().from(favoritesTable).orderBy(desc(favoritesTable.createdAt));
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/favorites - Add a favorite
router.post("/favorites", async (req, res, next) => {
  try {
    const { movieId, movieTitle, posterPath } = req.body;

    if (!movieId || !movieTitle || !posterPath) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const numericMovieId = parseInt(movieId, 10);
    if (isNaN(numericMovieId)) {
      res.status(400).json({ error: "Invalid movie ID" });
      return;
    }

    // Check if it already exists to prevent duplicate entries
    const existing = await db
      .select()
      .from(favoritesTable)
      .where(eq(favoritesTable.movieId, numericMovieId));

    if (existing.length > 0) {
      res.status(200).json(existing[0]);
      return;
    }

    const [newFavorite] = await db.insert(favoritesTable).values({
      movieId: numericMovieId,
      movieTitle,
      posterPath,
    }).returning();

    res.status(201).json(newFavorite);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/favorites/:movieId - Remove a favorite
router.delete("/favorites/:movieId", async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.movieId, 10);
    if (isNaN(movieId)) {
      res.status(400).json({ error: "Invalid movie ID" });
      return;
    }

    const [deletedFavorite] = await db
      .delete(favoritesTable)
      .where(eq(favoritesTable.movieId, movieId))
      .returning();

    if (!deletedFavorite) {
      res.status(404).json({ error: "Favorite not found" });
      return;
    }

    res.json({ success: true, message: "Favorite removed successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;
