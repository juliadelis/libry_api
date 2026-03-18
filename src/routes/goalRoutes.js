import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  addBookToYearGoal,
  getYearGoal,
  removeBookFromYearGoal,
  setYearGoalTarget,
} from "../controllers/goalController.js";
import {
  addBookToGoalSchema,
  setYearTargetSchema,
} from "../validators/goalValidators.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getYearGoal);
router.post("/books", validateRequest(addBookToGoalSchema), addBookToYearGoal);
router.delete("/books/:bookId", removeBookFromYearGoal);
router.patch(
  "/target",
  validateRequest(setYearTargetSchema),
  setYearGoalTarget,
);

export default router;
