import { AppFrame } from "@/components/app-frame";
import { RepositoryPageClient } from "@/components/repository-page-client";

export default function RepositoryPage() {
  return (
    <AppFrame
      activeStep="repository"
      eyebrow="page 1"
      title="Repository"
      description="Paste a GitHub repository URL, verify access, and prepare the workspace scan."
    >
      <RepositoryPageClient />
    </AppFrame>
  );
}
