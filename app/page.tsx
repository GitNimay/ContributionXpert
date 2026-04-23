import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="grid-paper min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-between px-5 py-6 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between border border-border bg-card px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold uppercase tracking-[-0.08em]">
            <img src="/logo.png" alt="ContributionXpert Logo" className="h-6 w-6 object-contain" />
            ContributionXpert
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/explore"
              className="hidden sm:inline-block px-3 py-2 text-sm font-bold uppercase transition hover:text-muted-foreground"
            >
              Explore
            </Link>
            <a
              href="https://github.com/GitNimay"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-block border border-border bg-card px-3 py-2 text-sm font-bold uppercase transition hover:border-foreground"
            >
              Support the Creator
            </a>
            <Link
              href="/repository"
              className="hidden sm:inline-block border border-foreground bg-foreground px-3 py-2 text-sm font-bold uppercase text-background transition hover:bg-background hover:text-foreground"
            >
              Start scan
            </Link>
            <ThemeToggle />
          </div>
        </nav>

        <div className="grid gap-8 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="enter-up">
            <p className="mb-5 inline-flex border border-border bg-card px-3 py-2 text-xs font-bold uppercase text-muted-foreground">
              GitHub contribution intelligence
            </p>
            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.12em] sm:text-7xl lg:text-8xl">
              See who actually moved the repo.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Scan commits, pull requests, reviews, changed files, and activity cadence to build
              an interactive leaderboard that can be shared with the whole team.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/repository"
                className="hard-shadow border border-foreground bg-foreground px-6 py-4 text-center text-sm font-black uppercase text-background transition hover:-translate-y-1"
              >
                Connect repository
              </Link>
              <Link
                href="/explore"
                className="border border-border bg-card px-6 py-4 text-center text-sm font-black uppercase transition hover:border-foreground"
              >
                Explore Projects
              </Link>
            </div>
          </div>

          <div className="scanline border border-foreground bg-card p-4 hard-shadow">
            <div className="border border-border bg-background p-4">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-xs uppercase text-muted-foreground">live board preview</span>
                <span className="h-3 w-3 animate-pulse bg-foreground" />
              </div>
              {[
                ["01", "maya", "2,480 pts", "94%"],
                ["02", "sam", "2,110 pts", "80%"],
                ["03", "ravi", "1,870 pts", "71%"],
                ["04", "lee", "1,330 pts", "50%"],
              ].map(([rank, name, points, width]) => (
                <div key={rank} className="mb-4 grid grid-cols-[40px_1fr_88px] items-center gap-3">
                  <span className="border border-border bg-muted px-2 py-1 text-center text-xs">{rank}</span>
                  <div>
                    <div className="mb-2 flex justify-between text-sm font-bold uppercase">
                      <span>{name}</span>
                      <span>{points}</span>
                    </div>
                    <div className="h-3 border border-border bg-muted">
                      <div className="h-full bg-foreground" style={{ width }} />
                    </div>
                  </div>
                  <span className="text-right text-xs uppercase text-muted-foreground">merged</span>
                </div>
              ))}
              <div className="mt-7 grid grid-cols-3 gap-2 text-center text-xs uppercase">
                <div className="border border-border bg-muted p-3">
                  <b className="block text-lg">418</b>
                  commits
                </div>
                <div className="border border-border bg-muted p-3">
                  <b className="block text-lg">96</b>
                  PRs
                </div>
                <div className="border border-border bg-muted p-3">
                  <b className="block text-lg">211</b>
                  reviews
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border border-border bg-card p-3 text-xs uppercase text-muted-foreground md:grid-cols-4">
          <span>01 repository intake</span>
          <span>02 workspace rules</span>
          <span>03 onboarding scan</span>
          <span>04 shareable report</span>
        </div>
      </section>
    </main>
  );
}
