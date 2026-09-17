import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { AuthProvider } from "@/lib/auth";
import { getAuth } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "HireShield | Threat Intelligence",
  description: "Evidence-driven recruitment safety and intelligence platform.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await getAuth()

  return (
    <AuthProvider>
      <html
        lang="en"
        className="h-full antialiased dark"
      >
        <body className="min-h-full flex flex-col bg-background text-slate-200 font-sans">
          <Navigation userId={userId} />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </body>
      </html>
    </AuthProvider>
  );
}
