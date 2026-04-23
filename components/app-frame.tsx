import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

type AppFrameProps = {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  activeStep?: "repository" | "workspace" | "onboarding" | "dashboard";
  hideSteps?: boolean;
};

const steps = [
  { id: "repository", label: "Repository", href: "/repository" },
  { id: "workspace", label: "Workspace", href: "/workspace/new" },
  { id: "onboarding", label: "Onboarding", href: "#" },
  { id: "dashboard", label: "Dashboard", href: "#" },
] as const;

export function AppFrame({ children, eyebrow, title, description, activeStep, hideSteps }: AppFrameProps) {
  return (
    <main className="grid-paper min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
        <nav className="mb-4 flex flex-col gap-3 border border-border bg-card p-3 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-black uppercase tracking-[-0.1em]">
            <img src="/logo.png" alt="ContributionXpert Logo" className="h-6 w-6 object-contain" />
            ContributionXpert
          </Link>
          <div className="flex items-center gap-4">
            {!hideSteps && (
              <div className="flex flex-wrap gap-2">
                {steps.map((step, index) => {
                  const isActive = step.id === activeStep;

                  return (
                    <Link
                      key={step.id}
                      href={step.href}
                      className={`border px-3 py-2 text-xs font-bold uppercase ${
                        isActive
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")} {step.label}
                    </Link>
                  );
                })}
              </div>
            )}
            <ThemeToggle />
          </div>
        </nav>

        <header className="mb-4 grid gap-3 border border-foreground bg-card p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            {eyebrow ? (
              <p className="mb-3 inline-flex border border-border bg-muted px-3 py-2 text-xs font-bold uppercase text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="max-w-5xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.11em] sm:text-6xl">
              {title}
            </h1>
          </div>
          {description ? <p className="max-w-xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </header>

        {children}
      </div>
    </main>
  );
}
