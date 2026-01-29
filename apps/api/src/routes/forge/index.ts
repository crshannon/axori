/**
 * Forge API Routes Index
 *
 * Exports all Forge-related routes for the AI-powered dev workflow engine
 */

import { Hono } from "hono";
import ticketsRouter from "./tickets";
import milestonesRouter from "./milestones";
import projectsRouter from "./projects";
import executionsRouter from "./executions";
import agentsRouter from "./agents";
import budgetRouter from "./budget";

const router = new Hono();

// Mount all Forge routes
router.route("/tickets", ticketsRouter);
router.route("/milestones", milestonesRouter);
router.route("/projects", projectsRouter);
router.route("/executions", executionsRouter);
router.route("/agents", agentsRouter);
router.route("/budget", budgetRouter);

export default router;
