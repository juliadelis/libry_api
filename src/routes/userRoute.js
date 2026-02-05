import express from "express";
import { deleteUser, updateUser } from "../controllers/userController";

const router = express.Router();
router.get("/:id", viewUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
