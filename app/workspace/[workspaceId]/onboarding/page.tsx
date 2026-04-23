import { AppFrame } from "@/components/app-frame";
import { OnboardingClient } from "@/components/onboarding-client";
import { normalizeAnalysisRequest } from "@/lib/github";

type OnboardingPageProps = {
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

export default async function OnboardingPage({ params, searchParams }: OnboardingPageProps) {
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
      activeStep="onboarding"
      eyebrow="Step 3: Processing"
      title="Analyzing Repository"
      description="We are currently fetching and analyzing data from GitHub to generate your real-time contribution insights."
    >
      <OnboardingClient workspaceId={workspaceId} workspaceName={workspaceName} config={config} />
    </AppFrame>
  );
}
