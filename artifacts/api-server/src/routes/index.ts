import { Router, type IRouter } from "express";
import healthRouter from "./health";
import reviewsRouter from "./reviews";
import favoritesRouter from "./favorites";

const router: IRouter = Router();

router.use(healthRouter);
router.use(reviewsRouter);
router.use(favoritesRouter);

export default router;
