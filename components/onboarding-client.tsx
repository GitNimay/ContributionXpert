"use client";

import Link from "next/link";
import { Check, Database, GitPullRequest, Radar, Share2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardLoader } from "@/components/dashboard-loader";
import type { AnalysisRequest } from "@/lib/types";

type OnboardingClientProps = {
  workspaceId: string;
  workspaceName: string;
  config: AnalysisRequest;
};

const steps = [
  {
    label: "Repository handshake",
    copy: "Validating owner, repo visibility, default branch, and API access.",
    icon: <Database className="h-5 w-5" />,
  },
  {
    label: "Commit scan",
    copy: "Reading commits, changed files, additions, deletions, and author identity.",
    icon: <Radar className="h-5 w-5" />,
  },
  {
    label: "Pull request graph",
    copy: "Comparing opened PRs, merged PRs, reviews, approvals, and comments.",
    icon: <GitPullRequest className="h-5 w-5" />,
  },
  {
    label: "Share layer",
    copy: "Preparing a safe read-only dashboard link for hosted deployments.",
    icon: <Share2 className="h-5 w-5" />,
  },
];

export function OnboardingClient({ workspaceId, workspaceName, config }: OnboardingClientProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => {
        if (current >= steps.length) {
          window.clearInterval(timer);
          return current;
        }

        return current + 1;
      });
    }, 650);

    return () => window.clearInterval(timer);
  }, []);

  const params = new URLSearchParams({
    repo: config.repo,
    rangeDays: String(config.rangeDays),
    scanDepth: config.scanDepth,
    includeBots: String(config.includeBots),
    workspaceName,
  });
  if (config.branch) params.set("branch", config.branch);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="border border-foreground bg-card p-5 hard-shadow">
          <div className="mb-5 flex items-center gap-2 text-sm font-black uppercase">
            <Sparkles className="h-5 w-5" />
            Workspace boot sequence
          </div>
          <div className="space-y-3">
            {steps.map((step, index) => {
              const done = active > index;
              const current = active === index;

              return (
                <div
                  key={step.label}
                  className={`border p-4 transition ${
                    done || current ? "border-foreground bg-background" : "border-border bg-muted opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-sm font-black uppercase">
                      {step.icon}
                      {step.label}
                    </div>
                    <span className="grid h-6 w-6 place-items-center border border-border bg-card">
                      {done ? <Check className="h-4 w-4" /> : String(index + 1)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.copy}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border border-border bg-card p-5">
          <p className="mb-3 text-xs font-bold uppercase text-muted-foreground">Workspace</p>
          <h2 className="text-4xl font-black uppercase leading-none tracking-[-0.1em]">{workspaceName}</h2>
          <div className="mt-5 grid gap-2 text-xs uppercase text-muted-foreground sm:grid-cols-2">
            <Info label="Repository" value={config.repo} />
            <Info label="Window" value={`${config.rangeDays} days`} />
            <Info label="Depth" value={config.scanDepth} />
            <Info label="Bots" value={config.includeBots ? "included" : "excluded"} />
          </div>
          <Link
            href={`/workspace/${workspaceId}/dashboard?${params.toString()}`}
            className="mt-5 inline-flex border border-border bg-muted px-4 py-3 text-xs font-black uppercase transition hover:border-foreground"
          >
            Open dashboard route
          </Link>
        </div>
      </section>

      {active >= steps.length ? (
        <DashboardLoader workspaceId={workspaceId} workspaceName={workspaceName} config={config} />
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-muted p-3">
      <span className="block">{label}</span>
      <b className="mt-1 block truncate text-foreground">{value}</b>
    </div>
  );
}
