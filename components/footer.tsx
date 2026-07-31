import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  learn: {
    title: "LEARN",
    columns: [
      [
        { label: "What's New", href: "#" },
        { label: "Getting Started", href: "#" },
        { label: "Documentation", href: "#" },
      ],
      [
        { label: "Browse Articles", href: "#" },
        { label: "Tutorials", href: "#" },
      ],
    ],
  },
  general: {
    title: "GENERAL",
    columns: [
      [
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Careers", href: "#" },
      ],
      [
        { label: "Changelog", href: "#" },
        { label: "Roadmap", href: "#" },
        { label: "Status", href: "#" },
      ],
      [
        { label: "Privacy", href: "#" },
        { label: "Terms", href: "#" },
      ],
    ],
  },
  resources: {
    title: "RESOURCES",
    columns: [
      [
        { label: "Ask for Help", href: "#" },
        { label: "API Reference", href: "#" },
        { label: "Developers", href: "#" },
      ],
    ],
  },
};

export function Footer() {
  return (
    <footer className="relative w-full overflow-hidden">
      {/* Background images - same as hero */}
      <Image
        src="/bg-web.png"
        alt=""
        fill
        priority={false}
        quality={90}
        sizes="100vw"
        className="object-cover object-right-bottom z-0 hidden md:block"
        style={{ pointerEvents: "none" }}
      />
      <Image
        src="/bg-mobile.png"
        alt=""
        fill
        priority={false}
        quality={90}
        sizes="100vw"
        className="object-cover object-bottom z-0 md:hidden"
        style={{ pointerEvents: "none" }}
      />

      {/* Dark overlay for contrast */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 bg-[#0c2a2a]/85 dark:bg-black/90"
      />

      {/* Content */}
      <div className="relative z-20 mx-auto w-full max-w-[1200px] px-6 py-16 sm:px-12 sm:py-20 lg:px-16">
        {/* Link Sections — staggered reveal */}
        <div className="grid grid-cols-1 gap-10 sm:gap-12 md:grid-cols-3 md:gap-8 sd-stagger">
          {/* LEARN */}
          <div className="sd-animate sd-reveal-up">
            <h3 className="mb-5 text-xs font-semibold tracking-widest text-white/70">
              {footerLinks.learn.title}
            </h3>
            <div className="flex gap-12">
              {footerLinks.learn.columns.map((column, colIdx) => (
                <ul key={colIdx} className="flex flex-col gap-3">
                  {column.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/90 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>

          {/* GENERAL */}
          <div className="sd-animate sd-reveal-up">
            <h3 className="mb-5 text-xs font-semibold tracking-widest text-white/70">
              {footerLinks.general.title}
            </h3>
            <div className="flex gap-12">
              {footerLinks.general.columns.map((column, colIdx) => (
                <ul key={colIdx} className="flex flex-col gap-3">
                  {column.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/90 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>

          {/* RESOURCES */}
          <div className="sd-animate sd-reveal-up">
            <h3 className="mb-5 text-xs font-semibold tracking-widest text-white/70">
              {footerLinks.resources.title}
            </h3>
            <div className="flex gap-12">
              {footerLinks.resources.columns.map((column, colIdx) => (
                <ul key={colIdx} className="flex flex-col gap-3">
                  {column.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/90 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright — reveal */}
        <div className="mt-14 border-t border-white/10 pt-8 sd-animate sd-reveal-up">
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} GitKiwi. A service provided for open
            source contributors.
          </p>
        </div>
      </div>
    </footer>
  );
}
