"use client";

import { AlertTriangle, Copy, Loader2, RefreshCw, Share2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { encodeSharePayload, shareUrlFor } from "@/lib/share";
import type { AnalysisRequest, RepositoryAnalysis, SharePayload } from "@/lib/types";

type DashboardLoaderProps = {
  config: AnalysisRequest;
  workspaceId?: string;
  workspaceName?: string;
  shareId?: string;
  mode?: "workspace" | "share";
};

type AnalysisResponse = {
  analysis?: RepositoryAnalysis;
  error?: string;
};

export function DashboardLoader({
  config,
  workspaceId,
  workspaceName = "Contribution Room",
  shareId,
  mode = "workspace",
}: DashboardLoaderProps) {
  const [analysis, setAnalysis] = useState<RepositoryAnalysis | null>(() => {
    if (typeof window === "undefined" || !workspaceId) return null;

    const cached = window.localStorage.getItem(`repo-signal:${workspaceId}`);
    if (!cached) return null;

    try {
      return JSON.parse(cached) as RepositoryAnalysis;
    } catch {
      window.localStorage.removeItem(`repo-signal:${workspaceId}`);
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const cacheKey = workspaceId ? `repo-signal:${workspaceId}` : null;

  async function runScan() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = (await response.json()) as AnalysisResponse;

      if (!response.ok || !data.analysis) {
        throw new Error(data.error ?? "Scan failed.");
      }

      setAnalysis(data.analysis);
      if (cacheKey) {
        window.localStorage.setItem(cacheKey, JSON.stringify(data.analysis));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Scan failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void runScan();
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId, workspaceId]);

  const payload: SharePayload = useMemo(() => ({
    ...config,
    createdAt: new Date().toISOString(),
    workspaceName,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [JSON.stringify(config), workspaceName]);

  const [displayShareUrl, setDisplayShareUrl] = useState<string>("");

  useEffect(() => {
    const longUrl = shareUrlFor(payload);
    setDisplayShareUrl(longUrl);

    let isMounted = true;
    async function shorten() {
      try {
        const res = await fetch("/api/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.id) {
            const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
            setDisplayShareUrl(`${baseUrl}/share/${data.id}`);
          }
        }
      } catch (e) {
        console.error("Failed to shorten", e);
      }
    }
    
    void shorten();
    
    return () => {
      isMounted = false;
    };
  }, [payload]);

  async function copyShareUrl() {
    await navigator.clipboard.writeText(displayShareUrl || shareUrlFor(payload));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (loading && !analysis) {
    return (
      <div className="grid min-h-[420px] place-items-center border border-foreground bg-card p-8 hard-shadow">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <h2 className="mt-5 text-2xl font-black uppercase tracking-[-0.08em]">Scanning repository</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Fetching commits, PRs, reviews, files, and contributor identities from GitHub.
          </p>
        </div>
      </div>
    );
  }

  if (error && !analysis) {
    return (
      <div className="border border-destructive bg-card p-6 text-destructive hard-shadow">
        <div className="mb-3 flex items-center gap-2 text-lg font-black uppercase">
          <AlertTriangle className="h-5 w-5" /> Scan blocked
        </div>
        <p className="text-sm leading-6">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border border-border bg-card p-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-muted-foreground">
            {mode === "share" ? "Public share view" : workspaceName}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Share id <code className="bg-muted px-1">{encodeSharePayload(payload).slice(0, 14)}...</code>
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void runScan()}
            className="inline-flex items-center justify-center gap-2 border border-border bg-background px-4 py-3 text-xs font-black uppercase transition hover:border-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh live
          </button>
          {mode !== "share" ? (
            <button
              type="button"
              onClick={() => void copyShareUrl()}
              className="inline-flex items-center justify-center gap-2 border border-foreground bg-foreground px-4 py-3 text-xs font-black uppercase text-background transition hover:bg-background hover:text-foreground"
            >
              {copied ? <Copy className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              {copied ? "Copied" : "Copy share link"}
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="border border-destructive bg-card p-3 text-sm text-destructive">
          Latest refresh failed, showing cached data. {error}
        </div>
      ) : null}

      {analysis ? <AnalyticsDashboard analysis={analysis} shareUrl={displayShareUrl || shareUrlFor(payload)} /> : null}
    </div>
  );
}
