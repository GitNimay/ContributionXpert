export type ScanDepth = "quick" | "standard" | "deep";

export type AnalysisRequest = {
  repo: string;
  branch?: string;
  rangeDays: number;
  scanDepth: ScanDepth;
  includeBots: boolean;
};

export type RepositoryPreview = {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  isPrivate: boolean;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  pushedAt: string | null;
  updatedAt: string | null;
};

export type ContributorDay = {
  date: string;
  commits: number;
  pullRequests: number;
  reviews: number;
  points: number;
};

export type ContributorStats = {
  id: string;
  login: string;
  displayName: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  email: string | null;
  isBot: boolean;
  commits: number;
  pullRequestsOpened: number;
  pullRequestsMerged: number;
  reviews: number;
  approvals: number;
  reviewComments: number;
  additions: number;
  deletions: number;
  filesChanged: number;
  uniqueFiles: number;
  activeDays: number;
  lastActiveAt: string | null;
  points: number;
  rank: number;
  scoreBreakdown: {
    code: number;
    pullRequests: number;
    reviews: number;
    consistency: number;
  };
  daily: ContributorDay[];
  topFiles: FileContribution[];
};

export type FileContribution = {
  path: string;
  extension: string;
  contributorId: string;
  contributorLogin: string;
  changes: number;
  additions: number;
  deletions: number;
};

export type TimelinePoint = {
  date: string;
  commits: number;
  pullRequests: number;
  reviews: number;
  additions: number;
  deletions: number;
  points: number;
};

export type PullRequestSummary = {
  number: number;
  title: string;
  state: string;
  author: string;
  merged: boolean;
  createdAt: string;
  mergedAt: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  url: string;
};

export type RepositoryAnalysis = {
  repo: RepositoryPreview;
  generatedAt: string;
  scan: {
    since: string;
    branch: string;
    scanDepth: ScanDepth;
    commitsScanned: number;
    commitDetailsScanned: number;
    pullRequestsScanned: number;
    pullRequestDetailsScanned: number;
    reviewsScanned: number;
    authenticated: boolean;
    warnings: string[];
    rateLimit: {
      limit: number | null;
      remaining: number | null;
      resetAt: string | null;
    };
  };
  totals: {
    contributors: number;
    commits: number;
    pullRequestsOpened: number;
    pullRequestsMerged: number;
    reviews: number;
    additions: number;
    deletions: number;
    filesChanged: number;
    points: number;
  };
  contributors: ContributorStats[];
  timeline: TimelinePoint[];
  files: FileContribution[];
  pullRequests: PullRequestSummary[];
};

export type SharePayload = AnalysisRequest & {
  createdAt?: string;
  workspaceName?: string;
};
