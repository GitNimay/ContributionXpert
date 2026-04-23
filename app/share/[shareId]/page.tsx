import { AppFrame } from "@/components/app-frame";
import { DashboardLoader } from "@/components/dashboard-loader";
import { decodeSharePayload } from "@/lib/share";

type SharePageProps = {
  params: Promise<{ shareId: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { shareId } = await params;
  let payload: ReturnType<typeof decodeSharePayload> | null = null;

  try {
    payload = decodeSharePayload(shareId);
  } catch {
    payload = null;
  }

  if (!payload) {
    return (
      <AppFrame
        activeStep="dashboard"
        eyebrow="public share"
        title="Invalid share link"
        description="This link could not be decoded. Ask the workspace owner to generate a new share URL."
      >
        <div className="border border-destructive bg-card p-6 text-sm text-destructive hard-shadow">
          The share payload is invalid or incomplete.
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame
      activeStep="dashboard"
      eyebrow="public share"
      title="Shared contribution board"
      description="Read-only GitHub contribution analytics generated from the repository and scan settings in this share link."
    >
      <DashboardLoader
        mode="share"
        shareId={shareId}
        workspaceName={payload.workspaceName || "Shared Board"}
        config={payload}
      />
    </AppFrame>
  );
}
