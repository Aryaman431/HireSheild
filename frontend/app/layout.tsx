import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ClerkProvider } from '@clerk/nextjs'
import { auth } from "@clerk/nextjs/server";

export const metadata: Metadata = {
  title: "HireShield | Threat Intelligence",
  description: "Evidence-driven recruitment safety and intelligence platform.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth()

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#64748b',
          colorBackground: '#020617',
          borderRadius: '2px',
        },
        elements: {
          card: 'border border-[#1e293b]',
          headerTitle: 'font-mono uppercase tracking-widest text-lg',
          headerSubtitle: 'font-mono text-xs text-slate-400',
          formButtonPrimary: 'font-mono font-bold uppercase tracking-widest bg-slate-800 hover:bg-slate-700 text-slate-300',
          socialButtonsBlockButton: 'font-mono text-xs border border-slate-800 hover:bg-slate-900',
          formFieldLabel: 'font-mono text-xs uppercase tracking-widest text-slate-500',
          formFieldInput: 'font-mono text-sm border-slate-800 focus:border-slate-500',
          footerActionLink: 'font-mono text-slate-400 hover:text-slate-300',
        }
      }}
    >
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
    </ClerkProvider>
  );
}
