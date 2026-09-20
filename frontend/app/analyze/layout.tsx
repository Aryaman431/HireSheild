import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analyze a Job Post | HireShield",
  description: "Inspect an opportunity for recruitment fraud.",
};

export default function AnalyzeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
