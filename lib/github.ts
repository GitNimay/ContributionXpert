import { calculateScore, extensionFor, isBotIdentity } from "@/lib/scoring";
import type {
  AnalysisRequest,
  ContributorDay,
  ContributorStats,
  FileContribution,
  PullRequestSummary,
  RepositoryAnalysis,
  RepositoryPreview,
  ScanDepth,
  TimelinePoint,
} from "@/lib/types";

const GITHUB_API_URL = "https://api.github.com";
const REST_VERSION = "2022-11-28";

type RateLimit = RepositoryAnalysis["scan"]["rateLimit"];

type GitHubUser = {
  login: string;
  avatar_url: string | null;
  html_url: string | null;
  type?: string;
};

type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string | null;
  updated_at: string | null;
  owner: GitHubUser;
};

type GitHubCommitListItem = {
  sha: string;
  html_url: string;
  author: GitHubUser | null;
  commit: {
    author: {
      name: string | null;
      email: string | null;
      date: string | null;
    } | null;
    committer: {
      name: string | null;
      email: string | null;
      date: string | null;
    } | null;
    message: string;
  };
};

type GitHubCommitDetail = GitHubCommitListItem & {
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: {
    filename: string;
    additions: number;
    deletions: number;
    changes: number;
  }[];
};

type GitHubPullRequestListItem = {
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  user: GitHubUser | null;
};

type GitHubPullRequestDetail = GitHubPullRequestListItem & {
  additions: number;
  deletions: number;
  changed_files: number;
};

type GitHubReview = {
  id: number;
  body: string | null;
  state: string;
  submitted_at: string | null;
  user: GitHubUser | null;
};

type ContributorAccumulator = Omit<
  ContributorStats,
  "rank" | "points" | "scoreBreakdown" | "daily" | "topFiles" | "activeDays" | "uniqueFiles"
> & {
  dayMap: Map<string, ContributorDay>;
  fileMap: Map<string, FileContribution>;
  activeDateSet: Set<string>;
  fileSet: Set<string>;
};

type GitHubRequestOptions = {
  token: string | undefined;
  rateLimit: RateLimit;
};

const depthLimits: Record<
  ScanDepth,
  { pages: number; commitDetails: number; pullRequestDetails: number }
> = {
  quick: { pages: 1, commitDetails: 40, pullRequestDetails: 12 },
  standard: { pages: 2, commitDetails: 140, pullRequestDetails: 42 },
  deep: { pages: 5, commitDetails: 380, pullRequestDetails: 120 },
};

export function parseRepositoryInput(input: string) {
  const trimmed = input.trim().replace(/\.git$/i, "");

  if (!trimmed) {
    throw new Error("Enter a GitHub repository URL or owner/repo path.");
  }

  const direct = trimmed.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (direct) {
    return { owner: direct[1], repo: direct[2], fullName: `${direct[1]}/${direct[2]}` };
  }

  try {
    const url = new URL(trimmed);
    if (!url.hostname.toLowerCase().endsWith("github.com")) {
      throw new Error("Only github.com repositories are supported right now.");
    }

    const [owner, repo] = url.pathname.split("/").filter(Boolean);
    if (!owner || !repo) {
      throw new Error("GitHub URL must look like https://github.com/owner/repo.");
    }

    return { owner, repo, fullName: `${owner}/${repo}` };
  } catch (error) {
    if (error instanceof Error && error.message.includes("GitHub URL")) {
      throw error;
    }

    throw new Error("Use a GitHub URL like https://github.com/vercel/next.js.");
  }
}

export function normalizeAnalysisRequest(input: {
  repo?: unknown;
  branch?: unknown;
  rangeDays?: unknown;
  scanDepth?: unknown;
  includeBots?: unknown;
}): AnalysisRequest {
  const repo = typeof input.repo === "string" ? input.repo.trim() : "";
  const branch = typeof input.branch === "string" ? input.branch.trim() : "";

  return {
    repo,
    branch: branch || undefined,
    rangeDays: clampNumber(Number(input.rangeDays ?? 90), 7, 3650),
    scanDepth: isScanDepth(input.scanDepth) ? input.scanDepth : "quick",
    includeBots: input.includeBots === true || input.includeBots === "true",
  };
}

export async function getRepositoryPreview(repoInput: string): Promise<RepositoryPreview> {
  const parsed = parseRepositoryInput(repoInput);
  const options = githubOptions();
  const repository = await githubFetch<GitHubRepository>(
    `/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`,
    options,
  );

  return toRepositoryPreview(repository);
}

export async function analyzeRepository(input: AnalysisRequest): Promise<RepositoryAnalysis> {
  const request = normalizeAnalysisRequest(input);
  const parsed = parseRepositoryInput(request.repo);
  const token = process.env.GITHUB_TOKEN?.trim() || undefined;
  const options = githubOptions(token);
  const limit = tunedLimit(request.scanDepth, Boolean(token));
  const since = new Date(Date.now() - request.rangeDays * 86_400_000).toISOString();
  const warnings: string[] = [];

  if (!token) {
    warnings.push(
      "No GITHUB_TOKEN is set, so GitHub anonymous rate limits apply and private repositories will not scan.",
    );
  }

  const repo = toRepositoryPreview(
    await githubFetch<GitHubRepository>(
      `/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`,
      options,
    ),
  );

  const branch = request.branch || repo.defaultBranch;
  const commits = await fetchCommitPages(parsed.owner, parsed.repo, branch, since, limit.pages, options);
  const pullRequests = await fetchPullRequestPages(parsed.owner, parsed.repo, limit.pages, options);

  const contributors = new Map<string, ContributorAccumulator>();
  const timeline = new Map<string, TimelinePoint>();
  const pullRequestSummaries: PullRequestSummary[] = [];
  let reviewCount = 0;

  const commitDetailLimit = Math.min(commits.length, limit.commitDetails);
  if (commitDetailLimit < commits.length) {
    warnings.push(
      `Commit details capped at ${commitDetailLimit} of ${commits.length} commits. Increase GITHUB_SCAN_MAX_PAGES or use deep mode for larger repos.`,
    );
  }

  const commitDetails = await mapLimit(
    commits.slice(0, commitDetailLimit),
    concurrency(),
    async (commit) => {
      try {
        return await githubFetch<GitHubCommitDetail>(
          `/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/commits/${commit.sha}`,
          options,
        );
      } catch {
        warnings.push(`Skipped commit detail ${commit.sha.slice(0, 7)} because GitHub did not return it.`);
        return commit;
      }
    },
  );

  for (const commit of commitDetails) {
    recordCommit(commit, contributors, timeline);
  }

  const pullRequestDetailLimit = Math.min(pullRequests.length, limit.pullRequestDetails);
  if (pullRequestDetailLimit < pullRequests.length) {
    warnings.push(
      `Pull request details capped at ${pullRequestDetailLimit} of ${pullRequests.length} PRs to stay inside API limits.`,
    );
  }

  const pullRequestDetails = await mapLimit(
    pullRequests.slice(0, pullRequestDetailLimit),
    concurrency(),
    async (pullRequest) => {
      try {
        const detail = await githubFetch<GitHubPullRequestDetail>(
          `/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/pulls/${pullRequest.number}`,
          options,
        );

        const reviews = await githubFetch<GitHubReview[]>(
          `/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/pulls/${pullRequest.number}/reviews?per_page=100`,
          options,
        );

        return { detail, reviews };
      } catch {
        warnings.push(`Skipped PR #${pullRequest.number} details because GitHub did not return them.`);
        return { detail: pullRequest as GitHubPullRequestDetail, reviews: [] };
      }
    },
  );

  for (const { detail, reviews } of pullRequestDetails) {
    pullRequestSummaries.push(recordPullRequest(detail, contributors, timeline));
    reviewCount += reviews.length;

    for (const review of reviews) {
      recordReview(review, contributors, timeline);
    }
  }

  const contributorList = finalizeContributors(contributors, request.includeBots);
  const files = contributorList
    .flatMap((contributor) => contributor.topFiles)
    .sort((a, b) => b.changes - a.changes)
    .slice(0, 80);
  const timelineList = finalizeTimeline(timeline, request.rangeDays, since);
  const totals = contributorList.reduce(
    (acc, contributor) => {
      acc.commits += contributor.commits;
      acc.pullRequestsOpened += contributor.pullRequestsOpened;
      acc.pullRequestsMerged += contributor.pullRequestsMerged;
      acc.reviews += contributor.reviews;
      acc.additions += contributor.additions;
      acc.deletions += contributor.deletions;
      acc.filesChanged += contributor.filesChanged;
      acc.points += contributor.points;
      return acc;
    },
    {
      contributors: contributorList.length,
      commits: 0,
      pullRequestsOpened: 0,
      pullRequestsMerged: 0,
      reviews: 0,
      additions: 0,
      deletions: 0,
      filesChanged: 0,
      points: 0,
    },
  );

  return {
    repo,
    generatedAt: new Date().toISOString(),
    scan: {
      since,
      branch,
      scanDepth: request.scanDepth,
      commitsScanned: commits.length,
      commitDetailsScanned: commitDetails.length,
      pullRequestsScanned: pullRequests.length,
      pullRequestDetailsScanned: pullRequestDetails.length,
      reviewsScanned: reviewCount,
      authenticated: Boolean(token),
      warnings,
      rateLimit: options.rateLimit,
    },
    totals,
    contributors: contributorList,
    timeline: timelineList,
    files,
    pullRequests: pullRequestSummaries.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }),
  };
}

async function fetchCommitPages(
  owner: string,
  repo: string,
  branch: string,
  since: string,
  pages: number,
  options: GitHubRequestOptions,
) {
  return fetchPages<GitHubCommitListItem>(
    (page) =>
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
        repo,
      )}/commits?sha=${encodeURIComponent(branch)}&since=${encodeURIComponent(since)}&per_page=100&page=${page}`,
    pages,
    options,
  );
}

async function fetchPullRequestPages(
  owner: string,
  repo: string,
  pages: number,
  options: GitHubRequestOptions,
) {
  return fetchPages<GitHubPullRequestListItem>(
    (page) =>
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
        repo,
      )}/pulls?state=all&sort=updated&direction=desc&per_page=100&page=${page}`,
    pages,
    options,
  );
}

async function fetchPages<T>(
  pathForPage: (page: number) => string,
  maxPages: number,
  options: GitHubRequestOptions,
) {
  const records: T[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const data = await githubFetch<T[]>(pathForPage(page), options);
    records.push(...data);

    if (data.length < 100) break;
  }

  return records;
}

async function githubFetch<T>(path: string, options: GitHubRequestOptions): Promise<T> {
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": REST_VERSION,
      "User-Agent": "real-time-contribution-dashboard",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
  });

  options.rateLimit.limit = numberHeader(response.headers.get("x-ratelimit-limit"));
  options.rateLimit.remaining = numberHeader(response.headers.get("x-ratelimit-remaining"));
  options.rateLimit.resetAt = resetHeader(response.headers.get("x-ratelimit-reset"));

  if (!response.ok) {
    const message = await safeErrorMessage(response);
    throw new Error(message || `GitHub API request failed with ${response.status}.`);
  }

  return (await response.json()) as T;
}

function recordCommit(
  commit: GitHubCommitListItem | GitHubCommitDetail,
  contributors: Map<string, ContributorAccumulator>,
  timeline: Map<string, TimelinePoint>,
) {
  const author = commit.commit.author;
  const date = author?.date ?? commit.commit.committer?.date ?? new Date().toISOString();
  const contributor = getContributor(contributors, commit.author, author?.email, author?.name);
  const additions = "stats" in commit && commit.stats ? commit.stats.additions : 0;
  const deletions = "stats" in commit && commit.stats ? commit.stats.deletions : 0;
  const files = "files" in commit && commit.files ? commit.files : [];

  contributor.commits += 1;
  contributor.additions += additions;
  contributor.deletions += deletions;
  contributor.filesChanged += files.length;
  touchContributor(contributor, date);

  const day = dayKey(date);
  const contributorDay = getContributorDay(contributor, day);
  const earned = 8 + Math.min(Math.round((additions + deletions) / 60), 12);
  contributorDay.commits += 1;
  contributorDay.points += earned;

  const timelineDay = getTimelineDay(timeline, day);
  timelineDay.commits += 1;
  timelineDay.additions += additions;
  timelineDay.deletions += deletions;
  timelineDay.points += earned;

  for (const file of files) {
    recordFile(contributor, file.filename, file.additions, file.deletions, file.changes);
  }
}

function recordPullRequest(
  pullRequest: GitHubPullRequestDetail,
  contributors: Map<string, ContributorAccumulator>,
  timeline: Map<string, TimelinePoint>,
): PullRequestSummary {
  const contributor = getContributor(contributors, pullRequest.user, null, pullRequest.user?.login);
  const date = pullRequest.merged_at ?? pullRequest.created_at;
  const day = dayKey(date);
  const isMerged = Boolean(pullRequest.merged_at);

  contributor.pullRequestsOpened += 1;
  contributor.pullRequestsMerged += isMerged ? 1 : 0;
  contributor.additions += pullRequest.additions ?? 0;
  contributor.deletions += pullRequest.deletions ?? 0;
  contributor.filesChanged += pullRequest.changed_files ?? 0;
  touchContributor(contributor, date);

  const contributorDay = getContributorDay(contributor, day);
  const earned = isMerged ? 70 : 20;
  contributorDay.pullRequests += 1;
  contributorDay.points += earned;

  const timelineDay = getTimelineDay(timeline, day);
  timelineDay.pullRequests += 1;
  timelineDay.additions += pullRequest.additions ?? 0;
  timelineDay.deletions += pullRequest.deletions ?? 0;
  timelineDay.points += earned;

  return {
    number: pullRequest.number,
    title: pullRequest.title,
    state: pullRequest.state,
    author: contributor.login,
    merged: isMerged,
    createdAt: pullRequest.created_at,
    mergedAt: pullRequest.merged_at,
    additions: pullRequest.additions ?? 0,
    deletions: pullRequest.deletions ?? 0,
    changedFiles: pullRequest.changed_files ?? 0,
    url: pullRequest.html_url,
  };
}

function recordReview(
  review: GitHubReview,
  contributors: Map<string, ContributorAccumulator>,
  timeline: Map<string, TimelinePoint>,
) {
  const date = review.submitted_at ?? new Date().toISOString();
  const contributor = getContributor(contributors, review.user, null, review.user?.login);
  const day = dayKey(date);
  const approved = review.state.toUpperCase() === "APPROVED";

  contributor.reviews += 1;
  contributor.approvals += approved ? 1 : 0;
  contributor.reviewComments += review.body?.trim() ? 1 : 0;
  touchContributor(contributor, date);

  const contributorDay = getContributorDay(contributor, day);
  const earned = 16 + (approved ? 12 : 0) + (review.body?.trim() ? 4 : 0);
  contributorDay.reviews += 1;
  contributorDay.points += earned;

  const timelineDay = getTimelineDay(timeline, day);
  timelineDay.reviews += 1;
  timelineDay.points += earned;
}

function getContributor(
  contributors: Map<string, ContributorAccumulator>,
  user: GitHubUser | null,
  email: string | null | undefined,
  name: string | null | undefined,
) {
  const key = user?.login ? `gh:${user.login.toLowerCase()}` : `mail:${(email || name || "unknown").toLowerCase()}`;
  const existing = contributors.get(key);

  if (existing) {
    if (!existing.avatarUrl && user?.avatar_url) existing.avatarUrl = user.avatar_url;
    if (!existing.profileUrl && user?.html_url) existing.profileUrl = user.html_url;
    return existing;
  }

  const login = user?.login ?? name ?? email ?? "unknown";
  const contributor: ContributorAccumulator = {
    id: key,
    login,
    displayName: user?.login ?? name ?? email ?? "Unknown contributor",
    avatarUrl: user?.avatar_url ?? null,
    profileUrl: user?.html_url ?? null,
    email: email ?? null,
    isBot: user?.type === "Bot" || isBotIdentity(user?.login) || isBotIdentity(email),
    commits: 0,
    pullRequestsOpened: 0,
    pullRequestsMerged: 0,
    reviews: 0,
    approvals: 0,
    reviewComments: 0,
    additions: 0,
    deletions: 0,
    filesChanged: 0,
    lastActiveAt: null,
    dayMap: new Map(),
    fileMap: new Map(),
    activeDateSet: new Set(),
    fileSet: new Set(),
  };

  contributors.set(key, contributor);
  return contributor;
}

function recordFile(
  contributor: ContributorAccumulator,
  path: string,
  additions: number,
  deletions: number,
  changes: number,
) {
  const previous = contributor.fileMap.get(path);
  contributor.fileSet.add(path);

  if (!previous) {
    contributor.fileMap.set(path, {
      path,
      extension: extensionFor(path),
      contributorId: contributor.id,
      contributorLogin: contributor.login,
      changes,
      additions,
      deletions,
    });
    return;
  }

  previous.changes += changes;
  previous.additions += additions;
  previous.deletions += deletions;
}

function finalizeContributors(
  contributors: Map<string, ContributorAccumulator>,
  includeBots: boolean,
): ContributorStats[] {
  const finalized = Array.from(contributors.values())
    .filter((contributor) => includeBots || !contributor.isBot)
    .map((contributor) => {
      const score = calculateScore({
        commits: contributor.commits,
        pullRequestsOpened: contributor.pullRequestsOpened,
        pullRequestsMerged: contributor.pullRequestsMerged,
        reviews: contributor.reviews,
        approvals: contributor.approvals,
        reviewComments: contributor.reviewComments,
        additions: contributor.additions,
        deletions: contributor.deletions,
        uniqueFiles: contributor.fileSet.size,
        activeDays: contributor.activeDateSet.size,
      });

      return {
        id: contributor.id,
        login: contributor.login,
        displayName: contributor.displayName,
        avatarUrl: contributor.avatarUrl,
        profileUrl: contributor.profileUrl,
        email: contributor.email,
        isBot: contributor.isBot,
        commits: contributor.commits,
        pullRequestsOpened: contributor.pullRequestsOpened,
        pullRequestsMerged: contributor.pullRequestsMerged,
        reviews: contributor.reviews,
        approvals: contributor.approvals,
        reviewComments: contributor.reviewComments,
        additions: contributor.additions,
        deletions: contributor.deletions,
        filesChanged: contributor.filesChanged,
        uniqueFiles: contributor.fileSet.size,
        activeDays: contributor.activeDateSet.size,
        lastActiveAt: contributor.lastActiveAt,
        points: score.total,
        rank: 0,
        scoreBreakdown: {
          code: score.code,
          pullRequests: score.pullRequests,
          reviews: score.reviews,
          consistency: score.consistency,
        },
        daily: Array.from(contributor.dayMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
        topFiles: Array.from(contributor.fileMap.values())
          .sort((a, b) => b.changes - a.changes)
          .slice(0, 8),
      };
    })
    .sort((a, b) => b.points - a.points);

  return finalized.map((contributor, index) => ({
    ...contributor,
    rank: index + 1,
  }));
}

function finalizeTimeline(timeline: Map<string, TimelinePoint>, rangeDays: number, since: string) {
  if (rangeDays > 180) {
    return Array.from(timeline.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  const points: TimelinePoint[] = [];
  const start = new Date(since);

  for (let index = 0; index < rangeDays; index += 1) {
    const current = new Date(start);
    current.setUTCDate(start.getUTCDate() + index);
    const date = current.toISOString().slice(0, 10);
    points.push(timeline.get(date) ?? blankTimelineDay(date));
  }

  return points;
}

function getContributorDay(contributor: ContributorAccumulator, date: string) {
  const existing = contributor.dayMap.get(date);
  if (existing) return existing;

  const day: ContributorDay = {
    date,
    commits: 0,
    pullRequests: 0,
    reviews: 0,
    points: 0,
  };

  contributor.dayMap.set(date, day);
  return day;
}

function getTimelineDay(timeline: Map<string, TimelinePoint>, date: string) {
  const existing = timeline.get(date);
  if (existing) return existing;

  const point = blankTimelineDay(date);
  timeline.set(date, point);
  return point;
}

function blankTimelineDay(date: string): TimelinePoint {
  return {
    date,
    commits: 0,
    pullRequests: 0,
    reviews: 0,
    additions: 0,
    deletions: 0,
    points: 0,
  };
}

function touchContributor(contributor: ContributorAccumulator, date: string) {
  contributor.activeDateSet.add(dayKey(date));

  if (!contributor.lastActiveAt || new Date(date).getTime() > new Date(contributor.lastActiveAt).getTime()) {
    contributor.lastActiveAt = date;
  }
}

function dayKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function toRepositoryPreview(repository: GitHubRepository): RepositoryPreview {
  const [owner, name] = repository.full_name.split("/");

  return {
    id: repository.id,
    owner,
    name,
    fullName: repository.full_name,
    description: repository.description,
    defaultBranch: repository.default_branch,
    isPrivate: repository.private,
    url: repository.html_url,
    stars: repository.stargazers_count,
    forks: repository.forks_count,
    openIssues: repository.open_issues_count,
    pushedAt: repository.pushed_at,
    updatedAt: repository.updated_at,
  };
}

function tunedLimit(scanDepth: ScanDepth, authenticated: boolean) {
  const base = depthLimits[scanDepth];
  const maxPages = clampNumber(Number(process.env.GITHUB_SCAN_MAX_PAGES ?? base.pages), 1, 8);

  if (authenticated) {
    return {
      pages: Math.min(base.pages, maxPages),
      commitDetails: base.commitDetails,
      pullRequestDetails: base.pullRequestDetails,
    };
  }

  return {
    pages: 1,
    commitDetails: Math.min(base.commitDetails, 28),
    pullRequestDetails: Math.min(base.pullRequestDetails, 8),
  };
}

function githubOptions(token = process.env.GITHUB_TOKEN?.trim() || undefined): GitHubRequestOptions {
  return {
    token,
    rateLimit: {
      limit: null,
      remaining: null,
      resetAt: null,
    },
  };
}

async function mapLimit<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>) {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function concurrency() {
  return clampNumber(Number(process.env.GITHUB_SCAN_CONCURRENCY ?? 4), 1, 8);
}

function isScanDepth(value: unknown): value is ScanDepth {
  return value === "quick" || value === "standard" || value === "deep";
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.round(value), min), max);
}

function numberHeader(value: string | null) {
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function resetHeader(value: string | null) {
  const seconds = numberHeader(value);
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function safeErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message;
  } catch {
    return response.statusText;
  }
}
