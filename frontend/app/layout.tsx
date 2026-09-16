import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ClerkProvider } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: "HireShield | Threat Intelligence",
  description: "Evidence-driven recruitment safety and intelligence platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className="h-full antialiased dark"
      >
        <body className="min-h-full flex flex-col bg-slate-950 text-slate-200 font-sans">
          <Navigation />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
