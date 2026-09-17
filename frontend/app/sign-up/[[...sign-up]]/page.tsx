import { SignUp } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/auth-config";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function Page() {
  if (isClerkConfigured()) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-12">
        <SignUp />
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-12 px-4">
      <div className="panel max-w-md w-full p-8 border border-surface-elevated text-center space-y-6">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <ShieldCheck size={24} />
        </div>
        
        <div>
          <span className="tech-label text-slate-400 mb-1">REGISTRATION SUBSYSTEM</span>
          <h1 className="text-xl font-mono font-bold uppercase tracking-wider text-slate-100">
            DEMO ACCESS ACTIVE
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-2 leading-relaxed">
            HireShield is running in demo mode. All deep threat analysis tools, entity verification checks, and historical databases are unlocked without registration.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <Link 
            href="/analyze"
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            <span>LAUNCH ANALYZER</span>
            <ArrowRight size={13} />
          </Link>
          <Link 
            href="/"
            className="btn-ghost text-xs font-mono"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
