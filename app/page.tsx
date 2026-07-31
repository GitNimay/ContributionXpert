import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Geist } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function Home() {
  return (
    <main
      className={`relative min-h-screen bg-[#F6F4F0] text-[#0A0A0A] ${geist.className}`}
    >
      {/* Hero Wrapper to anchor background to this section only */}
      <div className="relative min-h-screen flex flex-col justify-between">
        {/* Desktop: background image with a smooth left-to-right gradient overlay to blend colors and hide overlaps */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 hidden bg-[#F6F4F0] bg-no-repeat md:block"
          style={{
            backgroundImage: "url('/bg-web.png')",
            backgroundSize: "auto 100%",
            backgroundPosition: "right bottom",
          }}
        >
          <div
            className="absolute inset-0 z-10"
            style={{
              background: "linear-gradient(to right, #F6F4F0 0%, #F6F4F0 35%, rgba(246, 244, 240, 0.9) 45%, rgba(246, 244, 240, 0) 70%)",
            }}
          />
        </div>
        {/* Mobile: background image with a top-to-bottom gradient overlay to blend and prevent overlap */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 bg-[#F6F4F0] bg-no-repeat md:hidden"
          style={{
            backgroundImage: "url('/bg-mobile.png')",
            backgroundSize: "100% auto",
            backgroundPosition: "right bottom",
          }}
        >
          <div
            className="absolute inset-0 z-10"
            style={{
              background: "linear-gradient(to bottom, #F6F4F0 0%, #F6F4F0 30%, rgba(246, 244, 240, 0.8) 45%, rgba(246, 244, 240, 0) 75%)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-5 sm:px-8 lg:px-10">
          <nav className="flex h-14 shrink-0 items-center justify-between sm:h-16">
            <Link href="/" className="flex items-center gap-2 text-lg font-black uppercase tracking-[-0.1em]" aria-label="Home">
              <img src="/logo.png" alt="GitKiwi Logo" className="h-6 w-6 object-contain" />
              GitKiwi
            </Link>

            <div className="hidden items-center gap-7 text-sm font-normal text-[#444] lg:flex">
              <Link href="/repository" className="transition-colors hover:text-[#0A0A0A]">
                Connect Repo
              </Link>
              <Link href="/workspace/new" className="transition-colors hover:text-[#0A0A0A]">
                New Workspace
              </Link>
              <Link href="/explore" className="transition-colors hover:text-[#0A0A0A]">
                Explore
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/repository"
                className="hidden h-9 items-center justify-center rounded-lg border border-black/10 bg-white/80 px-3.5 text-sm font-medium text-[#0A0A0A] backdrop-blur-sm transition hover:bg-white sm:inline-flex"
              >
                Get Started
              </Link>
              <ThemeToggle />
            </div>
          </nav>

          <section className="flex min-h-0 flex-1 flex-col justify-center pb-16 pt-4 sm:pb-20">
            <div className="max-w-[45rem] enter-up">
              <h1
                className="font-semibold leading-[1.08] tracking-[-0.03em] text-[#0A0A0A]"
                style={{ fontSize: "clamp(1.875rem, 4.2vw, 3.5rem)" }}
              >
                <span className="block">Real-time Contributor</span>
                <span className="block">Leaderboards &</span>
                <span className="block text-[#666]">Analytics.</span>
              </h1>

              <p className="mt-5 max-w-[28rem] text-base leading-relaxed text-[#555] sm:mt-6 sm:text-lg sm:leading-[1.6]">
                Scan any GitHub repository and generate interactive contributor leaderboards, scoring, timelines, and shareable analytics — instantly.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
                <Link
                  href="/repository"
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-[#0A0A0A] px-5 text-sm font-medium text-white transition hover:bg-black/85"
                >
                  Analyze Repository
                </Link>
                <Link
                  href="/explore"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-black/15 bg-white/70 px-5 text-sm font-medium text-[#0A0A0A] backdrop-blur-sm transition hover:bg-white"
                >
                  Explore Community
                </Link>
              </div>

              {/* Bottom Stats Grid matching the reference layout */}
              <div className="mt-12 grid grid-cols-3 gap-6 border-t border-black/5 pt-8 max-w-[30rem] sm:mt-16">
                <div className="border-r border-black/10 pr-6">
                  <div className="text-xl font-bold tracking-tight text-[#0A0A0A] sm:text-2xl">24/7</div>
                  <div className="mt-1 text-[11px] text-[#555] leading-snug sm:text-xs">Real-time scans</div>
                </div>
                <div className="border-r border-black/10 pr-6">
                  <div className="text-xl font-bold tracking-tight text-[#0A0A0A] sm:text-2xl">100%</div>
                  <div className="mt-1 text-[11px] text-[#555] leading-snug sm:text-xs">Secure analysis</div>
                </div>
                <div>
                  <div className="text-xl font-bold tracking-tight text-[#0A0A0A] sm:text-2xl">Instant</div>
                  <div className="mt-1 text-[11px] text-[#555] leading-snug sm:text-xs">Dev scoring</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
