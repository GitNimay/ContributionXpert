import Link from "next/link";
import { AppFrame } from "@/components/app-frame";
import { WorkspaceForm } from "@/components/workspace-form";

type WorkspacePageProps = {
  searchParams: Promise<{
    repo?: string;
  }>;
};

export default async function CreateWorkspacePage({ searchParams }: WorkspacePageProps) {
  const params = await searchParams;
  const repo = params.repo ?? "";

  return (
    <AppFrame
      activeStep="workspace"
      eyebrow="page 2"
      title="Create workspace"
      description="Choose the scan window, scoring depth, and dashboard rules before onboarding starts."
    >
      {!repo ? (
        <div className="mb-4 border border-border bg-card p-4 text-sm text-muted-foreground">
          No repository is selected yet. You can type one below, or{" "}
          <Link href="/repository" className="font-bold text-foreground underline">
            validate it on the repository page
          </Link>
          .
        </div>
      ) : null}
      <WorkspaceForm initialRepo={repo} />
    </AppFrame>
  );
}
