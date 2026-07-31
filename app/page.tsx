import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { FeaturesBento } from "@/components/features-bento";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main
      className={`relative min-h-screen bg-surface text-foreground`}
    >
      {/* Hero Wrapper — anchors background images and content stacking */}
      <div className="relative min-h-screen min-h-dvh flex flex-col justify-between bg-surface">
        {/* Desktop: Next.js Image with automatic WebP/AVIF, eager preload, and object-cover */}
        <Image
          src="/bg-web.png"
          alt=""
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-right-bottom z-0 hidden md:block"
          style={{ pointerEvents: "none" }}
        />
        {/* Mobile: separate art-directed image for vertical composition */}
        <Image
          src="/bg-mobile.png"
          alt=""
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-bottom z-0 md:hidden"
          style={{ pointerEvents: "none" }}
        />

        {/* Desktop gradient overlay — fades image into background from left */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 hidden md:block hero-gradient-desktop"
        />
        {/* Mobile gradient overlay — fades image upward from bottom */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 md:hidden hero-gradient-mobile"
        />

        <div className="relative z-20 mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-4 sm:px-8 lg:px-10">
          <nav className="flex h-14 shrink-0 items-center justify-between sm:h-16">
            <Link href="/" className="flex items-center gap-2 text-lg font-black uppercase tracking-[-0.1em]" aria-label="Home">
              <img src="/logo.png" alt="GitKiwi Logo" className="h-6 w-6 object-contain" />
              GitKiwi
            </Link>

            <div className="hidden items-center gap-7 text-sm font-normal text-text-nav lg:flex">
              <Link href="/repository" className="transition-colors hover:text-foreground">
                Connect Repo
              </Link>
              <Link href="/workspace/new" className="transition-colors hover:text-foreground">
                New Workspace
              </Link>
              <Link href="/explore" className="transition-colors hover:text-foreground">
                Explore
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/repository"
                className="hidden h-9 items-center justify-center rounded-lg border border-border-subtle bg-surface-glass px-3.5 text-sm font-medium text-foreground backdrop-blur-sm transition hover:bg-surface-glass-hover sm:inline-flex"
              >
                Get Started
              </Link>
              <ThemeToggle />
            </div>
          </nav>

          <section className="flex min-h-0 flex-1 flex-col justify-center pb-[max(4rem,30vh)] pt-4 sm:pb-20 md:pb-20">
            <div className="w-full max-w-[45rem] enter-up">
              <h1
                className="font-semibold leading-[1.08] tracking-[-0.03em] text-foreground"
                style={{ fontSize: "clamp(2rem, 6.5vw, 3.5rem)" }}
              >
                <span className="block">Real-time Contributor</span>
                <span className="block">Leaderboards &amp;</span>
                <span className="block text-text-accent">Analytics.</span>
              </h1>

              <p className="mt-4 max-w-full text-[0.9375rem] leading-relaxed text-text-body sm:mt-6 sm:max-w-[28rem] sm:text-lg sm:leading-[1.6]">
                Scan any GitHub repository and generate interactive contributor leaderboards, scoring, timelines, and shareable analytics — instantly.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
                <Link
                  href="/repository"
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-foreground px-5 text-sm font-medium text-background transition opacity-90 hover:opacity-100 sm:h-10 sm:w-auto sm:rounded-lg"
                >
                  Analyze Repository
                </Link>
                <Link
                  href="/explore"
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border-soft bg-surface-glass-subtle px-5 text-sm font-medium text-foreground backdrop-blur-sm transition hover:bg-surface-glass-hover sm:h-10 sm:w-auto sm:rounded-lg"
                >
                  Explore Community
                </Link>
              </div>

              {/* Bottom Stats Grid matching the reference layout */}
              <div className="mt-10 grid grid-cols-3 gap-0 border-t border-border-faint pt-6 sm:mt-16 sm:max-w-[30rem] sm:gap-6 sm:border-border-subtle sm:pt-8">
                <div className="border-r border-border-subtle pr-4 sm:pr-6">
                  <div className="text-lg font-bold tracking-tight text-foreground sm:text-2xl">24/7</div>
                  <div className="mt-1 text-[10px] leading-snug text-text-body sm:text-xs">Real-time scans</div>
                </div>
                <div className="border-r border-border-subtle px-4 sm:px-0 sm:pr-6">
                  <div className="text-lg font-bold tracking-tight text-foreground sm:text-2xl">100%</div>
                  <div className="mt-1 text-[10px] leading-snug text-text-body sm:text-xs">Secure analysis</div>
                </div>
                <div className="pl-4 sm:pl-0">
                  <div className="text-lg font-bold tracking-tight text-foreground sm:text-2xl">Instant</div>
                  <div className="mt-1 text-[10px] leading-snug text-text-body sm:text-xs">Dev scoring</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ─── Divider ─── */}
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8 lg:px-10">
        <div className="border-t border-border-subtle" />
      </div>

      {/* ─── Features Bento Section ─── */}
      <FeaturesBento />

      {/* ─── Footer Section ─── */}
      <Footer />
    </main>
  );
}
