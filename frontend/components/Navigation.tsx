import Link from "next/link"
import { UserButton, SignInButton, SignUpButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"

export default async function Navigation() {
  const { userId } = await auth()

  return (
    <header className="sticky top-0 z-50 border-b border-surface-elevated/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-400/40 bg-brand-500/15 shadow-[0_0_18px_rgba(59,130,246,0.16)]">
            <span className="font-mono text-sm font-bold text-brand-300">H</span>
          </div>
          <Link href="/" className="font-mono text-sm font-bold uppercase tracking-[0.16em] text-slate-100 transition-colors hover:text-brand-300">HireShield</Link>
        </div>
        
        <nav className="hidden items-center gap-1 rounded-lg border border-surface-elevated/60 bg-slate-900/40 p-1 md:flex">
          <Link href="/analyze" className="rounded-md px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-400 transition hover:bg-surface-raised hover:text-brand-300">Analyze</Link>
          <Link href="/dashboard" className="rounded-md px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-400 transition hover:bg-surface-raised hover:text-brand-300">Dashboard</Link>
          <Link href="/community" className="rounded-md px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-400 transition hover:bg-surface-raised hover:text-brand-300">Community</Link>
        </nav>

        <div className="flex items-center gap-4">
          {userId ? (
            <div className="flex items-center gap-4">
              <UserButton />
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <SignInButton mode="modal">
                <button className="text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-slate-200">Log In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-md bg-brand-500 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-white transition-colors hover:bg-brand-400">Get started</button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
