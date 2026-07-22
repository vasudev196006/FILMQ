import { Router } from "express";
import { db, reviewsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

// GET /api/reviews - Get all reviews
router.get("/reviews", async (req, res, next) => {
  try {
    const data = await db.select().from(reviewsTable).orderBy(desc(reviewsTable.createdAt));
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/reviews/:movieId - Get reviews for a specific movie
router.get("/reviews/:movieId", async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.movieId, 10);
    if (isNaN(movieId)) {
      res.status(400).json({ error: "Invalid movie ID" });
      return;
    }
    const data = await db.select().from(reviewsTable).where(eq(reviewsTable.movieId, movieId)).orderBy(desc(reviewsTable.createdAt));
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/reviews - Create a new review
router.post("/reviews", async (req, res, next) => {
  try {
    const { movieId, movieTitle, moviePosterPath, reviewerName, rating, text, isSpoiler } = req.body;

    if (!movieId || !movieTitle || !reviewerName || rating === undefined || !text) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const numericRating = parseInt(rating, 10);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 10) {
      res.status(400).json({ error: "Rating must be between 1 and 10" });
      return;
    }

    const [newReview] = await db.insert(reviewsTable).values({
      movieId: parseInt(movieId, 10),
      movieTitle,
      moviePosterPath: moviePosterPath || "",
      reviewerName,
      rating: numericRating,
      text,
      isSpoiler: !!isSpoiler,
    }).returning();

    res.status(201).json(newReview);
  } catch (error) {
    next(error);
  }
});

// PUT /api/reviews/:id - Update an existing review
router.put("/reviews/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewerName, rating, text, isSpoiler, upvotes, downvotes } = req.body;

    const updateData: Partial<typeof reviewsTable.$inferInsert> = {};
    if (reviewerName !== undefined) updateData.reviewerName = reviewerName;
    if (rating !== undefined) {
      const numericRating = parseInt(rating, 10);
      if (isNaN(numericRating) || numericRating < 1 || numericRating > 10) {
        res.status(400).json({ error: "Rating must be between 1 and 10" });
        return;
      }
      updateData.rating = numericRating;
    }
    if (text !== undefined) updateData.text = text;
    if (isSpoiler !== undefined) updateData.isSpoiler = !!isSpoiler;
    if (upvotes !== undefined) updateData.upvotes = parseInt(upvotes, 10);
    if (downvotes !== undefined) updateData.downvotes = parseInt(downvotes, 10);

    const [updatedReview] = await db
      .update(reviewsTable)
      .set(updateData)
      .where(eq(reviewsTable.id, id))
      .returning();

    if (!updatedReview) {
      res.status(404).json({ error: "Review not found" });
      return;
    }

    res.json(updatedReview);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/reviews/:id - Delete a review
router.delete("/reviews/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [deletedReview] = await db
      .delete(reviewsTable)
      .where(eq(reviewsTable.id, id))
      .returning();

    if (!deletedReview) {
      res.status(404).json({ error: "Review not found" });
      return;
    }

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;
