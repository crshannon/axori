/**
 * Webhooks Routes Index
 *
 * Exports all webhook-related routes
 */

import { Hono } from "hono"
import githubRouter from "./github"

const router = new Hono()

// Mount GitHub webhooks
router.route("/github", githubRouter)

export default router
