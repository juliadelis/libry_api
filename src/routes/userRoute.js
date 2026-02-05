import express from "express";
import {
  deleteUser,
  updateUser,
  viewUser,
} from "../controllers/userController.js";

const router = express.Router();
router.get("/:id", viewUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
