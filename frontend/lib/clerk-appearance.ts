import { dark } from '@clerk/themes'

export function getClerkAppearance(theme: 'light' | 'dark' = 'dark') {
  const isDark = theme === 'dark'

  return {
    baseTheme: isDark ? dark : undefined,
    cssLayerName: 'clerk',
    variables: isDark
      ? {
          colorBackground: '#0a1024',
          colorInputBackground: '#0f1730',
          colorInputText: '#e6ebf5',
          colorText: '#e6ebf5',
          colorTextSecondary: '#9aa6c3',
          colorPrimary: '#e6ebf5',
          colorTextOnPrimaryBackground: '#0a1024',
          colorNeutral: '#e6ebf5',
          borderRadius: '2px',
        }
      : {
          colorBackground: '#ffffff',
          colorInputBackground: '#ffffff',
          colorInputText: '#0f172a',
          colorText: '#0f172a',
          colorTextSecondary: '#475569',
          colorPrimary: '#0f172a',
          colorTextOnPrimaryBackground: '#ffffff',
          colorNeutral: '#0f172a',
          borderRadius: '2px',
        },
    elements: {
      card: isDark 
        ? 'border border-[#2a3556] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
        : 'border border-[#cbd5e1] shadow-[0_4px_24px_rgba(0,0,0,0.1)]',
      modalBackdrop: isDark 
        ? 'bg-[rgba(2,6,23,0.6)] backdrop-blur-[4px]'
        : 'bg-[rgba(15,23,42,0.35)]',
      headerTitle: 'font-mono uppercase tracking-widest text-lg',
      headerSubtitle: 'font-mono text-xs',
      formButtonPrimary: 'font-mono font-bold uppercase tracking-widest bg-primary hover:opacity-90 text-primary-foreground border border-transparent shadow-[0_0_20px_rgba(0,0,0,0.1)]',
      socialButtonsBlockButton: 'font-mono text-xs border border-border hover:bg-surface-raised',
      formFieldLabel: 'font-mono text-xs uppercase tracking-widest text-text-muted',
      formFieldInput: 'font-mono text-sm border-border bg-surface focus:border-brand-500 text-text',
      dividerText: 'font-mono text-xs text-text-muted',
      footerActionText: 'font-mono text-xs text-text-muted',
      footerActionLink: 'font-mono text-xs text-brand-500 hover:text-brand-600',
      userButtonPopoverCard: isDark
        ? 'border border-[#2a3556] bg-[#0a1024] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
        : 'border border-[#cbd5e1] bg-[#ffffff] shadow-[0_4px_24px_rgba(0,0,0,0.1)]',
      userPreviewMainIdentifier: isDark ? 'text-[#e6ebf5]' : 'text-[#0f172a]',
      userPreviewSecondaryIdentifier: isDark ? 'text-[#9aa6c3]' : 'text-[#475569]',
      userButtonPopoverActionButton: isDark 
        ? 'hover:bg-[#131c3a] focus:ring-2 focus:ring-slate-500'
        : 'hover:bg-slate-100 focus:ring-2 focus:ring-slate-400',
      userButtonPopoverActionButtonText: isDark ? 'text-[#e6ebf5]' : 'text-[#0f172a]',
      userButtonPopoverActionButtonIcon: isDark ? 'text-[#9aa6c3]' : 'text-[#475569]',
      userButtonPopoverFooter: 'font-mono text-[10px] uppercase tracking-widest text-text-muted opacity-80',
      userButtonTrigger: 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background hover:ring-2 hover:ring-primary hover:ring-offset-2 hover:ring-offset-background rounded-full transition-shadow',
      navbar: isDark ? 'border-[#2a3556]' : 'border-[#cbd5e1]',
      navbarButton: isDark ? 'text-[#e6ebf5] hover:bg-[#131c3a]' : 'text-[#0f172a] hover:bg-slate-100',
      profileSectionTitle: 'font-mono uppercase tracking-widest text-sm',
    },
    localization: {
      signIn: {
        start: {
          title: "Sign in to HireShield",
          subtitle: "Welcome back to the intelligence platform",
        }
      },
      signUp: {
        start: {
          title: "Create your HireShield account",
          subtitle: "Join the evidence-driven recruitment platform",
        }
      }
    }
  }
}
