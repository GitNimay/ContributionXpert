import { AppFrame } from "@/components/app-frame";
import { DashboardLoader } from "@/components/dashboard-loader";
import { normalizeAnalysisRequest } from "@/lib/github";

type DashboardPageProps = {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{
    repo?: string;
    branch?: string;
    rangeDays?: string;
    scanDepth?: string;
    includeBots?: string;
    workspaceName?: string;
  }>;
};

export default async function WorkspaceDashboardPage({ params, searchParams }: DashboardPageProps) {
  const { workspaceId } = await params;
  const query = await searchParams;
  const config = normalizeAnalysisRequest({
    repo: query.repo,
    branch: query.branch,
    rangeDays: Number(query.rangeDays ?? 90),
    scanDepth: query.scanDepth,
    includeBots: query.includeBots === "true",
  });
  const workspaceName = query.workspaceName || "GitKiwi Workspace";

  return (
    <AppFrame
      activeStep="dashboard"
      eyebrow="shareable analytics"
      title="Contribution dashboard"
      description="A live GitHub contribution report with leaderboard, scoring, timelines, PRs, reviews, and file ownership signals."
    >
      <DashboardLoader workspaceId={workspaceId} workspaceName={workspaceName} config={config} />
    </AppFrame>
  );
}
