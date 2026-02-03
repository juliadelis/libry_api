import express from "express";
import {
  addToShelf,
  removeFromShelf,
  updateFromShelf,
  setShelfItemRating,
} from "../controllers/shelfController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  addToShelfSchema,
  updateShelfSchema,
} from "../validators/shelfValidators.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", validateRequest(addToShelfSchema), addToShelf);

router.put("/:id", validateRequest(updateShelfSchema), updateFromShelf);

router.patch("/shelf/:shelfItemId/rating", setShelfItemRating);

router.delete("/:id", removeFromShelf);

export default router;
