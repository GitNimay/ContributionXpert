"use client";

import { ArrowRight, GitBranch, Loader2, Lock, SearchCode, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import type { RepositoryPreview } from "@/lib/types";
import { compactNumber, timeAgo } from "@/lib/format";

type PreviewResponse = {
  preview?: RepositoryPreview;
  error?: string;
};

export function RepositoryPageClient() {
  const router = useRouter();
  const [repo, setRepo] = useState("");
  const [preview, setPreview] = useState<RepositoryPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const response = await fetch(`/api/repository?repo=${encodeURIComponent(repo)}`);
      const data = (await response.json()) as PreviewResponse;

      if (!response.ok || !data.preview) {
        throw new Error(data.error ?? "Repository could not be found.");
      }

      setPreview(data.preview);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Repository could not be found.");
    } finally {
      setLoading(false);
    }
  }

  function continueToWorkspace() {
    if (!preview) return;

    startTransition(() => {
      router.push(`/workspace/new?repo=${encodeURIComponent(preview.fullName)}`);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <section className="border border-foreground bg-card p-4 hard-shadow sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-xs font-black uppercase text-muted-foreground" htmlFor="repo">
            GitHub repository
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="repo"
              value={repo}
              onChange={(event) => setRepo(event.target.value)}
              placeholder="https://github.com/vercel/next.js"
              className="min-h-14 flex-1 border border-border bg-background px-4 text-sm outline-none transition focus:border-foreground"
            />
            <button
              type="submit"
              disabled={loading || !repo.trim()}
              className="inline-flex min-h-14 items-center justify-center gap-2 border border-foreground bg-foreground px-5 text-sm font-black uppercase text-background transition hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchCode className="h-4 w-4" />}
              Inspect
            </button>
          </div>
          {error ? <p className="border border-destructive bg-card p-3 text-sm text-destructive">{error}</p> : null}
        </form>

        {preview ? (
          <div className="mt-6 border border-border bg-background p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Validated repository</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.08em] sm:text-3xl break-all">
                  {preview.fullName}
                </h2>
              </div>
              <span className="inline-flex items-center gap-2 border border-border bg-muted px-3 py-2 text-xs font-bold uppercase">
                {preview.isPrivate ? <Lock className="h-3 w-3" /> : <Star className="h-3 w-3" />}
                {preview.isPrivate ? "Private" : "Public"}
              </span>
            </div>
            <p className="mb-5 max-w-2xl text-sm leading-6 text-muted-foreground">
              {preview.description || "No repository description is set."}
            </p>
            <div className="grid gap-2 text-xs uppercase sm:grid-cols-4">
              <Metric label="stars" value={compactNumber(preview.stars)} />
              <Metric label="forks" value={compactNumber(preview.forks)} />
              <Metric label="issues" value={compactNumber(preview.openIssues)} />
              <Metric label="pushed" value={timeAgo(preview.pushedAt)} />
            </div>
            <button
              type="button"
              onClick={continueToWorkspace}
              disabled={isPending}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 border border-foreground bg-foreground px-5 py-4 text-sm font-black uppercase text-background transition hover:bg-background hover:text-foreground disabled:opacity-60 sm:w-auto"
            >
              Create workspace <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </section>

      <aside className="border border-border bg-card p-5">
        <h2 className="text-lg font-black uppercase tracking-[-0.06em]">Platform Capabilities</h2>
        <div className="mt-4 space-y-4">
          <div className="border border-border bg-muted p-4 transition-colors hover:border-foreground">
             <div className="flex items-center gap-2 text-xs font-black uppercase text-foreground mb-1">
               <SearchCode className="w-4 h-4 text-primary" /> Intelligence
             </div>
             <p className="text-xs text-muted-foreground">
               Our engine parses commits, line changes, and PR activity to calculate impact scores across your entire history.
             </p>
          </div>
          <div className="border border-border bg-muted p-4 transition-colors hover:border-foreground">
             <div className="flex items-center gap-2 text-xs font-black uppercase text-foreground mb-1">
               <GitBranch className="w-4 h-4 text-primary" /> Multi-Branch Support
             </div>
             <p className="text-xs text-muted-foreground">
               Analyze the main branch or drill down into specific feature branches to see where the heavy lifting is happening.
             </p>
          </div>
          <div className="border border-border bg-muted p-4 transition-colors hover:border-foreground">
             <div className="flex items-center gap-2 text-xs font-black uppercase text-foreground mb-1">
               <Star className="w-4 h-4 text-primary" /> Engagement
             </div>
             <p className="text-xs text-muted-foreground">
               Celebrate your contributors with shared reports that highlight consistent cadence and review quality.
             </p>
          </div>
        </div>
        <div className="mt-6 border border-border bg-background p-4">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Private Scanning</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            For private repositories, ensure a valid <code className="bg-muted px-1">GITHUB_TOKEN</code> is configured in the backend environment.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-muted p-3">
      <b className="block text-lg text-foreground">{value}</b>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
