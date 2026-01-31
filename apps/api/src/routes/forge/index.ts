/**
 * Forge API Routes Index
 *
 * Exports all Forge-related routes for the AI-powered dev workflow engine
 */

import { Hono } from "hono";
import agentsRouter from "./agents";
import briefingRouter from "./briefing";
import budgetRouter from "./budget";
import decisionsRouter from "./decisions";
import executionsRouter from "./executions";
import featuresRouter from "./features";
import foundriesRouter from "./foundries";
import milestonesRouter from "./milestones";
import planningRouter from "./planning";
import projectsRouter from "./projects";
import registryRouter from "./registry";
import ticketsRouter from "./tickets";

const router = new Hono();

// Mount all Forge routes
router.route("/agents", agentsRouter);
router.route("/briefing", briefingRouter);
router.route("/budget", budgetRouter);
router.route("/decisions", decisionsRouter);
router.route("/executions", executionsRouter);
router.route("/features", featuresRouter);
router.route("/foundries", foundriesRouter);
router.route("/milestones", milestonesRouter);
router.route("/planning", planningRouter);
router.route("/projects", projectsRouter);
router.route("/registry", registryRouter);
router.route("/tickets", ticketsRouter);

export default router;
