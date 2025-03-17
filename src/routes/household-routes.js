import express from "express";
import { getAllHouseholds } from "../controllers/household-controller.js";

const router = express.Router();

router.get("/", getAllHouseholds);

export default router;