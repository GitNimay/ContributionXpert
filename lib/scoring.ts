import type { ContributorStats } from "@/lib/types";

type ScoreInput = Pick<
  ContributorStats,
  | "commits"
  | "pullRequestsOpened"
  | "pullRequestsMerged"
  | "reviews"
  | "approvals"
  | "reviewComments"
  | "additions"
  | "deletions"
  | "uniqueFiles"
  | "activeDays"
>;

export function calculateScore(input: ScoreInput) {
  const codeBase = input.commits * 8;
  const lineImpact = Math.min(Math.round((input.additions + input.deletions) / 45), 110);
  const fileSpread = Math.min(input.uniqueFiles * 2, 80);
  const code = codeBase + lineImpact + fileSpread;

  const pullRequests = input.pullRequestsOpened * 20 + input.pullRequestsMerged * 50;
  const reviews = input.reviews * 16 + input.approvals * 12 + input.reviewComments * 4;
  const consistency = Math.min(input.activeDays * 6, 90);

  return {
    code,
    pullRequests,
    reviews,
    consistency,
    total: code + pullRequests + reviews + consistency,
  };
}

export function isBotIdentity(value: string | null | undefined) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return (
    normalized.endsWith("[bot]") ||
    normalized.includes("-bot") ||
    normalized.includes("bot@") ||
    normalized.includes("dependabot") ||
    normalized.includes("renovate")
  );
}

export function extensionFor(path: string) {
  const file = path.split("/").pop() ?? path;
  const dot = file.lastIndexOf(".");
  if (dot <= 0 || dot === file.length - 1) return "other";
  return file.slice(dot + 1).toLowerCase();
}
