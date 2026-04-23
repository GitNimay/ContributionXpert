import { AppFrame } from "@/components/app-frame";
import { DashboardLoader } from "@/components/dashboard-loader";
import { decodeSharePayload } from "@/lib/share";
import { sql } from "@/lib/db";
import type { SharePayload } from "@/lib/types";

type SharePageProps = {
  params: Promise<{ shareId: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { shareId } = await params;
  let payload: SharePayload | null = null;

  try {
    payload = decodeSharePayload(shareId);
  } catch {
    try {
      const rows = await sql`SELECT payload FROM shares WHERE id = ${shareId}`;
      if (rows.length > 0) {
        payload = rows[0].payload as SharePayload;
      }
    } catch (dbError) {
      console.error("DB Error:", dbError);
    }
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
      hideSteps={true}
      hideHeader={true}
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
