"use client";

import { CircuitBoard, type CircuitNodeType, type CircuitConnection } from "@/components/ui/circuit-board";
import {
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  MessageSquareCheck,
  Star,
  Trophy,
  Activity,
  BarChart3,
  CalendarDays,
  Share2,
  Search,
  FileCode,
  Database,
  ArrowRight,
} from "lucide-react";
import React from "react";
import { useTheme } from "next-themes";

/* ─────────────────────────────────────────────
   Circuit diagram configs — one per card
   Viewport: 320×200, labels render inside lg nodes
   ───────────────────────────────────────────── */

const repoScanCircuit = {
  nodes: [
    { id: "repo", x: 40, y: 100, label: "Repo", status: "active" as const, size: "lg" as const, icon: <GitBranch size={18} /> },
    { id: "scan1", x: 140, y: 48, label: "Scan", status: "processing" as const, icon: <Search size={12} /> },
    { id: "scan2", x: 140, y: 152, label: "Parse", status: "active" as const, icon: <FileCode size={12} /> },
    { id: "merge", x: 240, y: 100, label: "Index", status: "active" as const, size: "lg" as const, icon: <Database size={18} /> },
    { id: "out", x: 310, y: 100, status: "active" as const, size: "sm" as const, icon: <ArrowRight size={10} /> },
  ],
  connections: [
    { from: "repo", to: "scan1", animated: true },
    { from: "repo", to: "scan2", animated: true },
    { from: "scan1", to: "merge", animated: true },
    { from: "scan2", to: "merge", animated: true },
    { from: "merge", to: "out", animated: true },
  ],
};

const scoringCircuit = {
  nodes: [
    { id: "hub", x: 170, y: 100, label: "Score", status: "processing" as const, size: "lg" as const, icon: <Star size={18} /> },
    { id: "c1", x: 55, y: 48, label: "Commits", status: "active" as const, icon: <GitCommitHorizontal size={11} /> },
    { id: "c2", x: 55, y: 100, label: "PRs", status: "active" as const, icon: <GitPullRequest size={11} /> },
    { id: "c3", x: 55, y: 152, label: "Reviews", status: "active" as const, icon: <MessageSquareCheck size={11} /> },
    { id: "rank", x: 285, y: 100, label: "Rank", status: "active" as const, size: "lg" as const, icon: <Trophy size={18} /> },
  ],
  connections: [
    { from: "c1", to: "hub", animated: true },
    { from: "c2", to: "hub", animated: true },
    { from: "c3", to: "hub", animated: true },
    { from: "hub", to: "rank", animated: true },
  ],
};

const analyticsCircuit = {
  nodes: [
    { id: "root", x: 160, y: 30, label: "Events", status: "active" as const, size: "lg" as const, icon: <Activity size={16} /> },
    { id: "l1", x: 90, y: 100, label: "Trend", status: "active" as const, icon: <BarChart3 size={11} /> },
    { id: "r1", x: 230, y: 100, label: "Chart", status: "processing" as const, icon: <BarChart3 size={11} /> },
    { id: "l2", x: 55, y: 170, label: "Day", status: "active" as const, icon: <CalendarDays size={10} /> },
    { id: "m2", x: 135, y: 170, label: "Week", status: "active" as const, icon: <CalendarDays size={10} /> },
    { id: "r2", x: 260, y: 170, label: "Share", status: "active" as const, icon: <Share2 size={10} /> },
  ],
  connections: [
    { from: "root", to: "l1", animated: true },
    { from: "root", to: "r1", animated: true },
    { from: "l1", to: "l2", animated: true },
    { from: "l1", to: "m2", animated: true },
    { from: "r1", to: "r2", animated: true },
  ],
};

/* ─────────────────────────────────────────────
   Individual Feature Card
   ───────────────────────────────────────────── */

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  circuit: {
    nodes: CircuitNodeType[];
    connections: CircuitConnection[];
  };
}

function FeatureCard({ icon, title, description, circuit }: FeatureCardProps) {
  const { theme } = useTheme();
  const circuitVariant = theme === "dark" ? "dark" : "light";

  return (
    <div className="flex flex-col rounded-2xl border border-border-subtle bg-surface-glass backdrop-blur-sm">
      {/* Top: icon + title */}
      <div className="border-b border-border-subtle p-5">
        <div className="inline-flex items-center gap-2 text-[0.8125rem] font-medium text-foreground">
          <span className="flex h-6 w-6 items-center justify-center opacity-60">{icon}</span>
          {title}
        </div>
      </div>

      {/* Middle: animated circuit diagram */}
      <div className="relative mx-4 my-4 h-[200px] rounded-xl border border-border-faint bg-surface">
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <CircuitBoard
            nodes={circuit.nodes}
            connections={circuit.connections}
            width={320}
            height={200}
            viewBox="-10 -10 340 220"
            gridSize={16}
            showGrid={true}
            traceWidth={1.2}
            pulseSpeed={2.8}
            variant={circuitVariant}
          />
        </div>
      </div>

      {/* Bottom: description */}
      <div className="border-t border-border-subtle p-5">
        <p className="text-[0.8125rem] leading-relaxed text-text-body">{description}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Features Bento Section
   ───────────────────────────────────────────── */

const features: FeatureCardProps[] = [
  {
    icon: <GitBranch size={14} />,
    title: "Repository Scanning",
    description:
      "Parse any GitHub repo — commits, PRs, and reviews extracted in seconds.",
    circuit: repoScanCircuit,
  },
  {
    icon: <Star size={14} />,
    title: "Contributor Scoring",
    description:
      "Weight commits, PRs, and reviews into a single leaderboard score.",
    circuit: scoringCircuit,
  },
  {
    icon: <BarChart3 size={14} />,
    title: "Real-time Analytics",
    description:
      "Live charts, trend lines, and week-over-week contributor deltas.",
    circuit: analyticsCircuit,
  },
];

export function FeaturesBento() {
  return (
    <section className="mx-auto w-full max-w-[1200px] px-4 py-20 sm:px-8 sm:py-28 lg:px-10">
      {/* Heading — blur reveal on scroll */}
      <div className="mb-12 lg:mb-16 sd-animate sd-blur-reveal">
        <h2
          className="font-semibold uppercase leading-[1.08] tracking-[-0.02em] text-foreground"
          style={{ fontSize: "clamp(1.6rem, 4vw, 2.75rem)" }}
        >
          Built for <span className="text-text-accent">contributors.</span>
        </h2>
      </div>

      {/* Three-column bento grid — cards reveal with scale + stagger */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sd-stagger">
        {features.map((feature) => (
          <div key={feature.title} className="sd-animate sd-reveal-scale">
            <FeatureCard {...feature} />
          </div>
        ))}
      </div>
    </section>
  );
}
