import express from "express";
import {
  addBookByIsbn,
  previewBookByIsbn,
  removeBookByIsbn,
  updateBookByIsbn,
  getBook,
} from "../controllers/bookController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/isbn/:isbn", previewBookByIsbn);

router.get("/:id", getBook);

router.post("/:isbn", addBookByIsbn);

router.put("/:isbn", updateBookByIsbn);

router.delete("/:isbn", removeBookByIsbn);

export default router;

//npx neonctl@latest init
