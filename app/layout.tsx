import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitKiwi | Real-time Contribution Dashboard",
  description:
    "Scan GitHub repositories and generate interactive contributor leaderboards, scoring, and shareable analytics.",
  icons: {
    icon: "/logo.png",
  },
};

import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "font-sans")}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
