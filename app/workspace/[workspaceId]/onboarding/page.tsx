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
  const workspaceName = query.workspaceName || "Contribution Room";

  return (
    <AppFrame
      activeStep="onboarding"
      eyebrow="page 3"
      title="Onboarding"
      description="The workspace is now scanning GitHub and turning raw repository activity into contribution intelligence."
    >
      <OnboardingClient workspaceId={workspaceId} workspaceName={workspaceName} config={config} />
    </AppFrame>
  );
}
