"use client";

import {
  Activity,
  AlertTriangle,
  Award,
  Braces,
  GitCommitHorizontal,
  GitPullRequest,
  MessageSquareText,
  Share2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  Brush,
  Legend,
} from "recharts";
import { compactNumber, integer, shortDate, timeAgo } from "@/lib/format";
import type { ContributorStats, RepositoryAnalysis } from "@/lib/types";

type AnalyticsDashboardProps = {
  analysis: RepositoryAnalysis;
  shareUrl: string;
};

const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function AnalyticsDashboard({ analysis, shareUrl }: AnalyticsDashboardProps) {
  const topContributors = analysis.contributors.slice(0, 8);
  const leaderData = topContributors.map((contributor) => ({
    name: contributor.login,
    points: contributor.points,
    commits: contributor.commits,
    prs: contributor.pullRequestsMerged,
  }));
  const timelineData = analysis.timeline.map((point) => ({
    ...point,
    label: shortDate(point.date),
  }));
  const mixData = [
    { name: "Commits", value: analysis.totals.commits },
    { name: "Merged PRs", value: analysis.totals.pullRequestsMerged },
    { name: "Reviews", value: analysis.totals.reviews },
    { name: "Files", value: analysis.totals.filesChanged },
  ].filter((item) => item.value > 0);
  const scatterData = analysis.contributors.map((contributor) => ({
    name: contributor.login,
    additions: contributor.additions,
    deletions: contributor.deletions,
    points: contributor.points,
  }));
  const radarSubject = topContributors[0];
  const radarData = radarSubject
    ? [
        { metric: "Code", value: radarSubject.scoreBreakdown.code },
        { metric: "PRs", value: radarSubject.scoreBreakdown.pullRequests },
        { metric: "Reviews", value: radarSubject.scoreBreakdown.reviews },
        { metric: "Cadence", value: radarSubject.scoreBreakdown.consistency },
      ]
    : [];

  return (
    <div className="space-y-3">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Award className="h-5 w-5" />}
          label="Contributors"
          value={integer(analysis.totals.contributors)}
          detail={`${compactNumber(analysis.totals.points)} total points`}
        />
        <StatCard
          icon={<GitCommitHorizontal className="h-5 w-5" />}
          label="Commits"
          value={integer(analysis.totals.commits)}
          detail={`${compactNumber(analysis.totals.additions)} additions`}
        />
        <StatCard
          icon={<GitPullRequest className="h-5 w-5" />}
          label="Merged PRs"
          value={integer(analysis.totals.pullRequestsMerged)}
          detail={`${integer(analysis.totals.pullRequestsOpened)} opened`}
        />
        <StatCard
          icon={<MessageSquareText className="h-5 w-5" />}
          label="Reviews"
          value={integer(analysis.totals.reviews)}
          detail={`${analysis.scan.authenticated ? "token scan" : "public scan"}`}
        />
      </section>

      <section className="grid gap-3 items-start xl:grid-cols-[1fr_0.85fr]">
        {/* Left Column */}
        <div className="space-y-3">
          <div className="border border-foreground bg-card p-4 hard-shadow">
            <SectionTitle icon={<Award className="h-5 w-5" />} title="Leaderboard details" />
            <div className="mt-3 divide-y divide-border border border-border">
              {analysis.contributors.map((contributor) => (
                <ContributorRow key={contributor.id} contributor={contributor} />
              ))}
            </div>
          </div>
          
          <div className="border border-border bg-card p-4">
            <SectionTitle icon={<TrendingUp className="h-5 w-5" />} title="Contribution leaderboard" />
            <div className="mt-3 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leaderData} layout="vertical" margin={{ left: 18, right: 24, top: 4, bottom: 4 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 2" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={82} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
                  <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip />} />
                  <Bar dataKey="points" fill="var(--chart-1)" radius={0}>
                    {leaderData.map((_, index) => (
                      <Cell key={index} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-border bg-card p-4">
            <SectionTitle icon={<Braces className="h-5 w-5" />} title="Impact mix" />
            <div className="mt-3 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={mixData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {mixData.map((_, index) => (
                      <Cell key={index} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-3 grid-cols-2">
            <div className="border border-border bg-card p-4">
              <SectionTitle icon={<GitCommitHorizontal className="h-5 w-5" />} title="Code volume" />
              <div className="mt-3 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="2 2" />
                    <XAxis dataKey="additions" name="additions" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
                    <YAxis dataKey="deletions" name="deletions" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
                    <Tooltip cursor={{ strokeDasharray: "2 2" }} content={<ChartTooltip />} />
                    <Scatter data={scatterData} fill="var(--chart-1)" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border border-border bg-card p-4">
              <SectionTitle icon={<ShieldCheck className="h-5 w-5" />} title="Top profile" />
              <div className="mt-3 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%">
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="metric" stroke="var(--muted-foreground)" />
                    <PolarRadiusAxis angle={90} tick={false} axisLine={false} />
                    <Radar dataKey="value" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.3} />
                    <Tooltip content={<ChartTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <div className="border border-border bg-card p-4">
            <SectionTitle icon={<Share2 className="h-5 w-5" />} title="Shareable report" />
            <p className="mt-3 break-all border border-border bg-muted p-3 text-xs text-muted-foreground">
              {shareUrl}
            </p>
          </div>

          <div className="border border-border bg-card p-4">
            <SectionTitle icon={<AlertTriangle className="h-5 w-5" />} title="Scan notes" />
            <div className="mt-3 grid gap-2 text-xs uppercase text-muted-foreground">
              <ScanLine label="Branch" value={analysis.scan.branch} />
              <ScanLine label="Depth" value={analysis.scan.scanDepth} />
              <ScanLine label="Commits read" value={integer(analysis.scan.commitDetailsScanned)} />
              <ScanLine label="PRs read" value={integer(analysis.scan.pullRequestDetailsScanned)} />
              <ScanLine label="Rate left" value={analysis.scan.rateLimit.remaining?.toString() ?? "unknown"} />
            </div>
            {analysis.scan.warnings.length ? (
              <div className="mt-3 space-y-2">
                {analysis.scan.warnings.map((warning) => (
                  <p key={warning} className="border border-border bg-muted p-3 text-xs leading-5 text-muted-foreground">
                    {warning}
                  </p>
                ))}
              </div>
            ) : null}
          </div>

          <div className="border border-border bg-card p-4">
            <SectionTitle icon={<Braces className="h-5 w-5" />} title="File ownership signals" />
            <div className="mt-3 space-y-2">
              {analysis.files.slice(0, 10).map((file) => (
                <div key={`${file.contributorId}:${file.path}`} className="border border-border bg-muted p-3">
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold uppercase">
                    <span className="truncate">{file.path}</span>
                    <span>{compactNumber(file.changes)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {file.contributorLogin} / .{file.extension}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border bg-card p-4">
            <SectionTitle icon={<Activity className="h-5 w-5" />} title="Activity over time" />
            <div className="mt-3 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                  <defs>
                    <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse">
                      <path d="M 0 6 L 6 0" stroke="var(--chart-3)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 2" />
                  <XAxis dataKey="label" minTickGap={28} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
                  <YAxis tickLine={false} axisLine={false} width={44} stroke="var(--muted-foreground)" />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px", textTransform: "uppercase", fontWeight: "bold" }} iconType="circle" />
                  <Area type="monotone" dataKey="commits" stackId="1" stroke="var(--chart-1)" fill="var(--chart-1)" />
                  <Area type="monotone" dataKey="pullRequests" stackId="1" stroke="var(--chart-2)" fill="var(--chart-2)" />
                  <Area type="monotone" dataKey="reviews" stackId="1" stroke="var(--chart-3)" fill="url(#hatch)" />
                  <Brush dataKey="label" height={25} stroke="var(--muted-foreground)" fill="var(--background)" travellerWidth={10} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContributorRow({ contributor }: { contributor: ContributorStats }) {
  const scoreTooltip = `Score Breakdown:
• Code: ${integer(contributor.scoreBreakdown.code)}
• PRs: ${integer(contributor.scoreBreakdown.pullRequests)}
• Reviews: ${integer(contributor.scoreBreakdown.reviews)}
• Cadence: ${integer(contributor.scoreBreakdown.consistency)}`;

  const ProfileLink = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    if (!contributor.profileUrl) return <div className={className}>{children}</div>;
    return (
      <a href={contributor.profileUrl} target="_blank" rel="noreferrer" className={`hover:opacity-75 transition-opacity ${className || ""}`}>
        {children}
      </a>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-background p-3 transition hover:bg-muted/50">
      <div className="flex items-start sm:items-center gap-3 w-full sm:w-auto">
        <div className="shrink-0 grid h-9 w-9 place-items-center border border-border bg-muted text-sm font-black">
          {String(contributor.rank).padStart(2, "0")}
        </div>
        <div className="flex-1 min-w-0 sm:hidden flex justify-between items-center">
           <ProfileLink className="flex items-center gap-2">
            {contributor.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={contributor.avatarUrl}
                alt=""
                className="h-6 w-6 border border-border grayscale"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <h3 className="truncate text-lg font-black tracking-[-0.04em]">{contributor.login}</h3>
            {contributor.isBot ? (
              <span className="border border-border bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">bot</span>
            ) : null}
          </ProfileLink>
          <div className="text-right" title={scoreTooltip}>
            <p className="text-lg font-black tracking-[-0.06em] leading-none cursor-help">{integer(contributor.points)}</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <ProfileLink className="hidden sm:flex flex-wrap items-center gap-2">
          {contributor.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={contributor.avatarUrl}
              alt=""
              className="h-6 w-6 border border-border grayscale"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <h3 className="truncate text-lg font-black tracking-[-0.04em]">{contributor.login}</h3>
          {contributor.isBot ? (
            <span className="border border-border bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">bot</span>
          ) : null}
        </ProfileLink>
        <div className="mt-2 sm:mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span><strong className="text-foreground">{integer(contributor.commits)}</strong> commits</span>
          <span><strong className="text-foreground">{integer(contributor.pullRequestsMerged)}</strong> merged PRs</span>
          <span><strong className="text-foreground">{integer(contributor.reviews)}</strong> reviews</span>
          <span className="uppercase">{timeAgo(contributor.lastActiveAt)}</span>
        </div>
      </div>
      <div className="hidden sm:block text-right" title={scoreTooltip}>
        <p className="text-xl font-black tracking-[-0.06em] leading-none cursor-help">{integer(contributor.points)}</p>
        <p className="text-[10px] font-bold uppercase text-muted-foreground mt-0.5">points</p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between text-muted-foreground">
        {icon}
        <span className="text-xs font-bold uppercase">{label}</span>
      </div>
      <p className="text-4xl font-black tracking-[-0.1em]">{value}</p>
      <p className="mt-2 text-xs uppercase text-muted-foreground">{detail}</p>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
      <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[-0.03em]">
        {icon}
        {title}
      </h2>
    </div>
  );
}

function ScanLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border border-border bg-muted p-3">
      <span>{label}</span>
      <b className="text-foreground">{value}</b>
    </div>
  );
}

type TooltipItem = {
  name?: string;
  value?: string | number;
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="border border-foreground bg-card p-3 text-xs hard-shadow">
      {label ? <p className="mb-2 font-black uppercase">{label}</p> : null}
      {payload.map((item) => (
        <p key={`${item.name}-${item.value}`} className="flex items-center justify-between gap-5 uppercase">
          <span className="text-muted-foreground">{item.name}</span>
          <b>{compactNumber(Number(item.value ?? 0))}</b>
        </p>
      ))}
    </div>
  );
}
