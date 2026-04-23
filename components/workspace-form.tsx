"use client";

import { ArrowRight, Bot, CalendarClock, Gauge, Globe2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import type { ScanDepth } from "@/lib/types";

type WorkspaceFormProps = {
  initialRepo: string;
};

const scanModes: { id: ScanDepth; label: string; copy: string }[] = [
  { id: "quick", label: "Quick", copy: "Best for first scan and public repos." },
  { id: "standard", label: "Standard", copy: "More PR and commit detail when token exists." },
  { id: "deep", label: "Deep", copy: "Largest scan, best with GitHub token." },
];

export function WorkspaceForm({ initialRepo }: WorkspaceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [workspaceName, setWorkspaceName] = useState("GitKiwi Workspace");
  const [repo, setRepo] = useState(initialRepo);
  const [branch, setBranch] = useState("");
  const [rangeDays, setRangeDays] = useState("90");
  const [scanDepth, setScanDepth] = useState<ScanDepth>("quick");
  const [includeBots, setIncludeBots] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const workspaceId = crypto.randomUUID();
    const params = new URLSearchParams({
      repo: repo.trim(),
      workspaceName: workspaceName.trim() || "GitKiwi Workspace",
      rangeDays,
      scanDepth,
      includeBots: String(includeBots),
    });

    if (branch.trim()) params.set("branch", branch.trim());

    startTransition(() => {
      router.push(`/workspace/${workspaceId}/onboarding?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <section className="border border-foreground bg-card p-4 hard-shadow sm:p-6">
        <div className="grid gap-4">
          <Field label="Workspace name">
            <input
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              className="min-h-14 w-full border border-border bg-background px-4 text-sm outline-none transition focus:border-foreground"
            />
          </Field>

          <Field label="Repository">
            <input
              value={repo}
              onChange={(event) => setRepo(event.target.value)}
              placeholder="owner/repo"
              required
              className="min-h-14 w-full border border-border bg-background px-4 text-sm outline-none transition focus:border-foreground"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Branch override">
              <input
                value={branch}
                onChange={(event) => setBranch(event.target.value)}
                placeholder="default branch"
                className="min-h-14 w-full border border-border bg-background px-4 text-sm outline-none transition focus:border-foreground"
              />
            </Field>
            <Field label="Activity window">
              <select
                value={rangeDays}
                onChange={(event) => setRangeDays(event.target.value)}
                className="min-h-14 w-full border border-border bg-background px-4 text-sm outline-none transition focus:border-foreground"
              >
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="180">Last 180 days</option>
                <option value="365">Last 12 months</option>
                <option value="1095">Last 3 years</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-xs font-black uppercase text-muted-foreground">Scan depth</p>
          <div className="grid gap-3 md:grid-cols-3">
            {scanModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setScanDepth(mode.id)}
                className={`border p-4 text-left transition ${
                  scanDepth === mode.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background hover:border-foreground"
                }`}
              >
                <span className="block text-sm font-black uppercase">{mode.label}</span>
                <span className="mt-2 block text-xs leading-5 opacity-75">{mode.copy}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3 border border-border bg-muted p-4">
          <input
            type="checkbox"
            checked={includeBots}
            onChange={(event) => setIncludeBots(event.target.checked)}
            className="mt-1 h-4 w-4 accent-foreground"
          />
          <span>
            <span className="block text-sm font-black uppercase">Include bot accounts</span>
            <span className="text-sm leading-6 text-muted-foreground">
              Keep this off for team contribution scoring unless automation should be ranked.
            </span>
          </span>
        </label>

        <button
          type="submit"
          disabled={isPending || !repo.trim()}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 border border-foreground bg-foreground px-5 py-4 text-sm font-black uppercase text-background transition hover:bg-background hover:text-foreground disabled:opacity-60 sm:w-auto"
        >
          Start onboarding scan <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      <aside className="grid gap-3">
        <InfoCard
          icon={<Gauge className="h-5 w-5" />}
          title="Point system"
          copy="Commits, merged PRs, review quality, file spread, and active days all contribute. Huge line changes are capped to prevent gaming."
        />
        <InfoCard
          icon={<Globe2 className="h-5 w-5" />}
          title="Shareability"
          copy="Every dashboard can generate a public read-only share route with the repo and scan settings encoded in the URL."
        />
        <InfoCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Credential safety"
          copy="GitHub credentials stay server-side in .env.local and are never bundled into the client."
        />
        <InfoCard
          icon={<CalendarClock className="h-5 w-5" />}
          title="Real-time path"
          copy="The app includes a signed webhook endpoint for production incremental refreshes."
        />
        <InfoCard
          icon={<Bot className="h-5 w-5" />}
          title="Noise controls"
          copy="Bot accounts are excluded by default, and generated-file heavy activity is softened through scoring caps."
        />
      </aside>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function InfoCard({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase">
        {icon}
        {title}
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{copy}</p>
    </div>
  );
}
