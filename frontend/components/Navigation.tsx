import Link from "next/link"
import { UserButton, SignInButton, SignUpButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"

export default async function Navigation() {
  const { userId } = await auth()

  return (
    <header className="border-b border-surface-elevated bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-brand-500/10 border border-brand-500/30 flex items-center justify-center">
            <span className="font-mono font-bold text-brand-500 text-xs">H</span>
          </div>
          <Link href="/" className="font-mono font-bold tracking-widest text-sm uppercase text-brand-100 hover:text-brand-300 transition-colors">HireShield</Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/analyze" className="text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-brand-400 transition-colors">Analyze</Link>
          <Link href="/dashboard" className="text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-brand-400 transition-colors">Dashboard</Link>
          <Link href="/community" className="text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-brand-400 transition-colors">Community</Link>
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
                <button className="text-[10px] font-mono font-bold uppercase tracking-widest bg-brand-500 text-slate-950 px-3 py-1 rounded hover:bg-brand-400 transition-colors">Initialize</button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
