import Link from "next/link";
import { sql } from "@/lib/db";
import { AppFrame } from "@/components/app-frame";
import type { SharePayload } from "@/lib/types";
import { GitBranch, Clock, ArrowRight } from "lucide-react";

export const revalidate = 60; // Refresh every 60 seconds

export default async function ExplorePage() {
  let shares: Array<{ id: string; payload: SharePayload }> = [];

  try {
    const rows = await sql`SELECT id, payload FROM shares ORDER BY payload->>'createdAt' DESC LIMIT 50`;
    shares = rows.map((r: any) => ({ id: r.id, payload: r.payload as SharePayload }));
  } catch (e) {
    console.error("Failed to fetch shares", e);
  }

  // Deduplicate by owner/repo keeping the most recent (they are ordered DESC)
  const uniqueShares = new Map<string, typeof shares[0]>();
  for (const share of shares) {
    if (!share.payload?.repo) continue;
    const key = share.payload.repo;
    if (!uniqueShares.has(key)) {
      uniqueShares.set(key, share);
    }
  }

  const projects = Array.from(uniqueShares.values());

  return (
    <AppFrame
      activeStep="dashboard"
      hideSteps={true}
      eyebrow="Explore"
      title="Community Projects"
      description="Discover other open-source repositories and view their real-time contribution analytics."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <div className="col-span-full border border-border bg-card p-6 text-center text-muted-foreground">
            No projects have been shared yet.
          </div>
        ) : (
          projects.map(({ id, payload }) => (
            <Link
              key={id}
              href={`/share/${id}`}
              className="group flex flex-col justify-between border border-border bg-card p-5 transition-colors hover:border-foreground"
            >
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">
                  {payload.workspaceName || "Public Share"}
                </p>
                <h3 className="text-xl font-black uppercase tracking-[-0.04em] break-words">
                  {payload.repo}
                </h3>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {payload.branch && (
                    <span className="flex items-center gap-1">
                      <GitBranch className="h-3 w-3" />
                      {payload.branch}
                    </span>
                  )}
                  {payload.createdAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(payload.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex h-8 w-8 items-center justify-center border border-border bg-muted transition-colors group-hover:bg-foreground group-hover:text-background">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </AppFrame>
  );
}
