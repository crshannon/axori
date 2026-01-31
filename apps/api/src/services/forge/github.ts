/**
 * GitHub Service
 *
 * Shared utilities for interacting with GitHub API
 */

import { Octokit } from "@octokit/rest";

// =============================================================================
// Configuration
// =============================================================================

function getGithubToken(): string | undefined {
  return process.env.GITHUB_TOKEN;
}

function getGithubOwner(): string {
  return process.env.GITHUB_OWNER || "crshannon";
}

function getGithubRepo(): string {
  return process.env.GITHUB_REPO || "axori";
}

// =============================================================================
// Client
// =============================================================================

let octokit: Octokit | null = null;

export function getOctokit(): Octokit {
  if (!getGithubToken()) {
    throw new Error("GITHUB_TOKEN not configured");
  }
  if (!octokit) {
    octokit = new Octokit({ auth: getGithubToken() });
  }
  return octokit;
}

export function isGithubConfigured(): boolean {
  return !!getGithubToken();
}

// =============================================================================
// PR Operations
// =============================================================================

export interface PRStatus {
  number: number;
  state: "open" | "closed" | "merged";
  mergeable: boolean | null;
  mergeableState: string;
  checksStatus: "pending" | "success" | "failure" | "unknown";
  checksDetails: Array<{
    name: string;
    status: string;
    conclusion: string | null;
  }>;
  reviewStatus: "approved" | "changes_requested" | "pending" | "none";
  canMerge: boolean;
}

/**
 * Get the status of a pull request
 */
export async function getPRStatus(prNumber: number): Promise<PRStatus> {
  const client = getOctokit();
  const owner = getGithubOwner();
  const repo = getGithubRepo();

  // Get PR details
  const { data: pr } = await client.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  // Get check runs for the PR's head commit
  let checksStatus: PRStatus["checksStatus"] = "unknown";
  let checksDetails: PRStatus["checksDetails"] = [];

  try {
    const { data: checkRuns } = await client.checks.listForRef({
      owner,
      repo,
      ref: pr.head.sha,
    });

    checksDetails = checkRuns.check_runs.map((run) => ({
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
    }));

    if (checkRuns.check_runs.length === 0) {
      checksStatus = "unknown";
    } else if (checkRuns.check_runs.some((r) => r.status !== "completed")) {
      checksStatus = "pending";
    } else if (checkRuns.check_runs.every((r) => r.conclusion === "success" || r.conclusion === "skipped")) {
      checksStatus = "success";
    } else {
      checksStatus = "failure";
    }
  } catch {
    // Check runs API might not be available
    checksStatus = "unknown";
  }

  // Get review status
  let reviewStatus: PRStatus["reviewStatus"] = "none";
  try {
    const { data: reviews } = await client.pulls.listReviews({
      owner,
      repo,
      pull_number: prNumber,
    });

    const latestReviews = new Map<string, string>();
    for (const review of reviews) {
      if (review.user && review.state !== "COMMENTED") {
        latestReviews.set(review.user.login, review.state);
      }
    }

    const states = Array.from(latestReviews.values());
    if (states.includes("CHANGES_REQUESTED")) {
      reviewStatus = "changes_requested";
    } else if (states.includes("APPROVED")) {
      reviewStatus = "approved";
    } else if (states.length > 0) {
      reviewStatus = "pending";
    }
  } catch {
    reviewStatus = "none";
  }

  // Determine if PR can be merged
  const canMerge =
    pr.state === "open" &&
    pr.mergeable === true &&
    checksStatus === "success" &&
    reviewStatus !== "changes_requested";

  return {
    number: pr.number,
    state: pr.merged ? "merged" : (pr.state as "open" | "closed"),
    mergeable: pr.mergeable,
    mergeableState: pr.mergeable_state,
    checksStatus,
    checksDetails,
    reviewStatus,
    canMerge,
  };
}

/**
 * Merge a pull request
 */
export async function mergePR(
  prNumber: number,
  options?: {
    mergeMethod?: "merge" | "squash" | "rebase";
    commitTitle?: string;
    commitMessage?: string;
  }
): Promise<{ merged: boolean; sha: string; message: string }> {
  const client = getOctokit();
  const owner = getGithubOwner();
  const repo = getGithubRepo();

  const { data } = await client.pulls.merge({
    owner,
    repo,
    pull_number: prNumber,
    merge_method: options?.mergeMethod || "squash",
    commit_title: options?.commitTitle,
    commit_message: options?.commitMessage,
  });

  return {
    merged: data.merged,
    sha: data.sha,
    message: data.message,
  };
}
