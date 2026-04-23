import { AppFrame } from "@/components/app-frame";
import { RepositoryPageClient } from "@/components/repository-page-client";

export default function RepositoryPage() {
  return (
    <AppFrame
      activeStep="repository"
      eyebrow="Step 1: Setup"
      title="Connect Repository"
      description="Enter a GitHub repository URL to connect your project and begin the analysis process."
    >
      <RepositoryPageClient />
    </AppFrame>
  );
}
