"use client";

import { AlertTriangle, ArrowUpRight, Copy, Loader2, RefreshCw, Share2, Star } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { encodeSharePayload, shareUrlFor } from "@/lib/share";
import type { AnalysisRequest, RepositoryAnalysis, SharePayload } from "@/lib/types";
import { compactNumber } from "@/lib/format";

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
  workspaceName = "GitKiwi Workspace",
  shareId,
  mode = "workspace",
}: DashboardLoaderProps) {
  const [mounted, setMounted] = useState(false);
  const [analysis, setAnalysis] = useState<RepositoryAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const cacheKey = workspaceId ? `repo-signal:${workspaceId}` : null;

  useEffect(() => {
    setMounted(true);
    if (cacheKey) {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) {
        try {
          setAnalysis(JSON.parse(cached) as RepositoryAnalysis);
        } catch {
          window.localStorage.removeItem(cacheKey);
        }
      }
    }
  }, [cacheKey]);

  const [currentStage, setCurrentStage] = useState("Initializing scan...");
  const [progress, setProgress] = useState(0);

  async function runScan() {
    setLoading(true);
    setError(null);
    setProgress(0);
    setCurrentStage("Connecting...");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Scan failed.");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          let data;
          try {
            data = JSON.parse(line);
          } catch (e) {
            console.error("Failed to parse stream line", e);
            continue;
          }
          
          if (data.type === "progress") {
            setProgress(data.progress);
            setCurrentStage(data.stage);
          } else if (data.type === "complete") {
            setAnalysis(data.analysis);
            if (cacheKey) {
              window.localStorage.setItem(cacheKey, JSON.stringify(data.analysis));
            }
          } else if (data.type === "error") {
            throw new Error(data.message);
          }
        }
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

  if (!mounted || (loading && !analysis)) {
    return (
      <div className="grid min-h-[420px] place-items-center border border-foreground bg-card p-8 hard-shadow">
        <div className="text-center w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-foreground" />
          </div>
          <h2 className="mt-5 text-2xl font-black uppercase tracking-[-0.08em]">Scanning repository</h2>
          <p className="mt-3 mb-6 h-6 text-sm leading-6 text-muted-foreground transition-all duration-300">
            {currentStage}
          </p>
          <div className="h-4 w-full border border-border bg-muted overflow-hidden">
            <div 
              className="h-full bg-foreground transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-right text-xs font-bold uppercase text-muted-foreground">
            {Math.round(progress)}%
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
      {mode === "share" && analysis && (
        <div className="mb-6 flex flex-col gap-4 border border-foreground bg-card p-6 hard-shadow sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground">Public Repository Analytics</p>
            <h1 className="mt-2 text-2xl font-black uppercase leading-[0.9] tracking-[-0.08em] sm:text-4xl md:text-5xl lg:text-6xl break-all">
              {analysis.repo.fullName}
            </h1>
            <a
              href={analysis.repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground transition hover:text-foreground underline underline-offset-4"
            >
              View on GitHub <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center gap-3 border border-border bg-muted px-5 py-4">
            <Star className="h-5 w-5 text-yellow-500" />
            <div className="flex flex-col leading-none">
              <span className="text-2xl font-black uppercase tracking-tight">{compactNumber(analysis.repo.stars)}</span>
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Stars</span>
            </div>
          </div>
        </div>
      )}
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
