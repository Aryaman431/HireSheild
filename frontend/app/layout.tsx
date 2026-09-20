import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { AuthProvider } from "@/lib/auth";
import { getAuth } from "@/lib/auth-server";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "HireShield | Threat Intelligence",
  description: "Evidence-driven recruitment safety and intelligence platform.",
  openGraph: {
    title: "HireShield | Threat Intelligence",
    description: "Evidence-driven recruitment safety and intelligence platform.",
    url: "https://hireshield.app",
    siteName: "HireShield",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HireShield | Threat Intelligence",
    description: "Evidence-driven recruitment safety and intelligence platform.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await getAuth()

  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-text font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <Navigation userId={userId} />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
            <footer className="w-full border-t border-border mt-auto">
              <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <span className="font-bold uppercase tracking-widest text-text">HireShield</span>
                  <span>&copy; {new Date().getFullYear()}</span>
                </div>
                <div className="flex flex-wrap items-center gap-6">
                  <a href="/analyze" className="hover:text-text transition-colors uppercase tracking-wider">Analyze</a>
                  <a href="/community" className="hover:text-text transition-colors uppercase tracking-wider">Community</a>
                  <a href="/privacy" className="hover:text-text transition-colors uppercase tracking-wider">Privacy</a>
                  <a href="/terms" className="hover:text-text transition-colors uppercase tracking-wider">Terms</a>
                </div>
              </div>
            </footer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
