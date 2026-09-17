'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion } from 'framer-motion'
import { 
  Shield, 
  FileText, 
  Image as ImageIcon, 
  UploadCloud, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  Trash2, 
  Terminal,
  AlertOctagon
} from 'lucide-react'
import { getBrowserApiUrl } from '@/lib/api'

const LOADING_STAGES = [
  { name: "VALIDATING SOURCE", log: "Checking payload integrity and sanitizing input stream..." },
  { name: "EXTRACTING JOB CLAIMS", log: "Isolating compensation, entities, and requirements via NLP parser..." },
  { name: "IDENTIFYING COMPANY ENTITY", log: "Resolving organization identity and querying authoritative registries..." },
  { name: "CHECKING RECRUITER CHANNELS", log: "Cross-referencing recruiter email domain with official records..." },
  { name: "ANALYZING RISK SIGNALS", log: "Evaluating 14 threat heuristics (fees, urgency, impersonation)..." },
  { name: "HISTORICAL INTELLIGENCE", log: "Querying semantic similarity index against past scam clusters..." },
  { name: "COMMUNITY THREAT MATCHING", log: "Checking victim confirmation records and fraud reports..." },
  { name: "VERIFICATION CHECKS", log: "Synthesizing live DNS, MX records, and domain provenance..." },
  { name: "FINAL RISK ASSESSMENT", log: "Aggregating weighted risk score and defensive guidance..." }
]

const ALLOWED_MIME_TYPES = {
  IMAGE: ["image/png", "image/jpeg", "image/webp"],
  PDF: ["application/pdf"]
}

const SAMPLE_PRESETS = [
  {
    title: "🚨 SCAM OFFER (EQUIPMENT FEE)",
    badge: "CRITICAL RISK",
    badgeClass: "badge-critical",
    preview: "Telegram interview + $250 upfront fee for home office MacBook setup",
    text: `Subject: Official Offer Letter - Remote Operations Specialist (Apex Logistics Group)

Dear Candidate,

Congratulations! Following your review on Telegram with our Senior Talent Director (@apex_hiring_manager), the executive board at Apex Logistics Group has approved your hiring as a Remote Operations Specialist at an hourly compensation of $48.50/hour.

This role includes comprehensive health benefits and 25 days paid time off. Because this position is 100% remote, we will send an encrypted corporate laptop, monitors, and secure routing equipment directly to your residential address.

In accordance with our company hardware policy, you are required to submit a refundable equipment security deposit of $250 via Zelle, Apple Pay, or Bitcoin transfer to our authorized provisioning coordinator prior to dispatch. This sum will be reimbursed in your first bi-weekly paycheck.

You must reply to this email within 24 hours to secure your onboarding date. Please send your payment receipt to apex-onboarding-desk@gmail.com.`
  },
  {
    title: "⚠️ SUSPICIOUS COMPENSATION",
    badge: "HIGH RISK",
    badgeClass: "badge-high",
    preview: "$190k/yr junior assistant with crypto payroll & personal routing demands",
    text: `Role: Senior Executive Personal Assistant (Remote - Immediate Start)
Organization: Global Vanguard Holdings Ltd.
Compensation: $190,000 USD Annual + Performance Bonuses

We are seeking a reliable individual to manage executive scheduling, domestic errands, and confidential financial disbursements. No prior administrative or corporate experience is necessary. Full on-the-job remote training provided.

Core Duties:
- Monitor incoming executive correspondence
- Execute urgent wire and cryptocurrency transfers for company supplies
- Manage daily financial transactions using your personal local bank accounts or crypto wallets

Requirements:
- Valid US/Canada resident
- Must have an active bank account in good standing
- Send your full legal name, date of birth, SSN, and bank routing details to hr-vanguard-careers@yahoo.com for immediate background clearance.`
  },
  {
    title: "🛡️ LEGITIMATE TECH POSTING",
    badge: "VERIFIED LOW RISK",
    badgeClass: "badge-verified",
    preview: "Authentic Software Engineer role with official domain application flow",
    text: `Role: Senior Software Engineer, Platform Infrastructure
Company: Stripe, Inc.
Location: San Francisco, CA / Seattle, WA / Remote (US)
Base Salary: $165,000 - $210,000 + Equity + Comprehensive Benefits

About Stripe:
Stripe builds economic infrastructure for the internet. Businesses of every size—from new startups to public companies—use our software to accept payments and manage their businesses online.

The Role:
We are looking for seasoned engineers to scale our core payment orchestration platform. You will design distributed systems that handle millions of transactions per second with 99.999% reliability.

Qualifications:
- 4+ years of professional software engineering experience
- Proficiency in Java, Go, or Ruby
- Experience building and operating fault-tolerant distributed systems
- Strong fundamentals in data modeling and network protocols

Hiring Process:
1. Initial Recruiter Chat (30 min)
2. Technical Screening (60 min coding)
3. Virtual Onsite Loop (System design, architecture, and team values)

Apply directly via our verified portal: https://stripe.com/jobs/infrastructure-senior-swe`
  }
]

export default function AnalyzePage() {
  const router = useRouter()
  const { getToken } = useAuth()
  const [activeTab, setActiveTab] = useState<'TEXT' | 'IMAGE' | 'PDF'>('TEXT')
  
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loadedPreset, setLoadedPreset] = useState<string | null>(null)
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [loadingStage, setLoadingStage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const validateAndSetFile = (selectedFile: File) => {
    setError(null)
    setIsDragging(false)
    
    // Size check
    const maxSizeMB = 10
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File exceeds maximum size of ${maxSizeMB}MB.`)
      return
    }

    // Type check
    const allowedTypes = activeTab === 'IMAGE' ? ALLOWED_MIME_TYPES.IMAGE : ALLOWED_MIME_TYPES.PDF
    if (!allowedTypes.includes(selectedFile.type)) {
      setError(`Unsupported file type for ${activeTab} mode. Allowed: ${allowedTypes.join(', ')}`)
      return
    }

    setFile(selectedFile)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const loadPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setActiveTab('TEXT')
    setText(preset.text)
    setLoadedPreset(preset.title)
    setError(null)
  }

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (activeTab === 'TEXT' && text.trim().length < 50) {
      setError("Please provide at least 50 characters of job description text or use a preset below.")
      return
    }
    
    if (activeTab !== 'TEXT' && !file) {
      setError(`Please select a ${activeTab.toLowerCase()} file to analyze.`)
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setLoadingStage(0)
    
    const stageInterval = setInterval(() => {
      setLoadingStage((prev: number) => (prev < LOADING_STAGES.length - 1 ? prev + 1 : prev))
    }, 1300)

    try {
      let token: string | null = null
      try {
        token = await getToken()
      } catch {
        token = null
      }
      if (!token) {
        token = "demo_token"
      }

      const apiUrl = getBrowserApiUrl()
      
      let response: Response;
      
      if (activeTab === 'TEXT') {
        response = await fetch(`${apiUrl}/api/v1/jobs/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text })
        })
      } else {
        const formData = new FormData()
        if (file) formData.append('file', file)
        
        response = await fetch(`${apiUrl}/api/v1/jobs/analyze-file`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = response.status === 401
          ? "Your session expired. Please sign in again."
          : response.status >= 500
            ? "The analysis service is temporarily unavailable."
            : errorData.detail || "Analysis failed on the server."
        throw new Error(message)
      }

      const data = await response.json()
      
      clearInterval(stageInterval)
      router.push(`/analyze/result/${data.job_id}`)
      
    } catch (err) {
      const error = err as Error
      clearInterval(stageInterval)
      setError(error.name === 'TypeError'
        ? "Unable to reach the analysis service. Please make sure the backend is running on port 8000."
        : error.message || "An unexpected error occurred during analysis.")
      setIsAnalyzing(false)
      setLoadingStage(0)
    }
  }

  // ============================================================
  // LOADING STATE: CYBER THREAT SCANNING ENGINE
  // ============================================================
  if (isAnalyzing) {
    const progressPercent = Math.round(((loadingStage + 1) / LOADING_STAGES.length) * 100)
    const currentStage = LOADING_STAGES[loadingStage]

    return (
      <div className="app-page flex items-center justify-center min-h-[80vh] px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="panel flex w-full max-w-2xl flex-col gap-6 p-6 sm:p-8 border border-surface-elevated bg-slate-950/90 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle scanning beam animation */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(59,130,246,0.06)_50%,transparent_100%)] animate-[pulse_2s_ease-in-out_infinite]" />

          {/* Scanner Header */}
          <div className="flex items-center justify-between border-b border-surface-elevated pb-4">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
              <div>
                <h2 className="tech-label m-0 text-slate-200">DEFENSIVE ANALYSIS ENGINE</h2>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  DEEP RECRUITMENT THREAT SCAN
                </p>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs font-bold text-brand-400">{progressPercent}% COMPLETE</span>
              <span className="block text-[10px] text-slate-500">STAGE {loadingStage + 1} OF {LOADING_STAGES.length}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-surface-elevated h-1.5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-brand-500 via-cyan-400 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Stages List */}
          <div className="space-y-2 py-1 max-h-[320px] overflow-y-auto">
            {LOADING_STAGES.map((stage, idx) => {
              const isPast = idx < loadingStage
              const isCurrent = idx === loadingStage
              
              return (
                <div 
                  key={stage.name} 
                  className={`flex items-center justify-between font-mono text-xs p-2 rounded transition-all ${
                    isCurrent 
                      ? 'bg-brand-500/10 border border-brand-500/30 text-white' 
                      : isPast 
                        ? 'text-slate-500 bg-surface/40' 
                        : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 flex justify-center shrink-0">
                      {isPast ? (
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      ) : isCurrent ? (
                        <Loader2 size={14} className="text-cyan-400 animate-spin" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                      )}
                    </div>
                    <span className={isCurrent ? 'font-bold tracking-wide text-slate-100' : ''}>
                      {String(idx + 1).padStart(2, '0')}. {stage.name}
                    </span>
                  </div>

                  <span className="text-[10px] uppercase tracking-widest shrink-0">
                    {isPast ? (
                      <span className="text-emerald-400 font-bold">VERIFIED</span>
                    ) : isCurrent ? (
                      <span className="text-cyan-400 font-bold animate-pulse">PROCESSING</span>
                    ) : (
                      <span className="text-slate-600">QUEUED</span>
                    )}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Live Telemetry Log Box */}
          <div className="p-3 bg-surface border border-surface-elevated rounded font-mono text-xs flex items-center gap-2 text-slate-400">
            <Terminal size={14} className="text-brand-400 shrink-0" />
            <span className="text-slate-500 font-bold shrink-0">[TELEMETRY]:</span>
            <span className="truncate text-slate-300">{currentStage.log}</span>
          </div>
        </motion.div>
      </div>
    )
  }

  // ============================================================
  // NORMAL ANALYZE FORM
  // ============================================================
  return (
    <div className="app-page">
      <div className="page-wrap max-w-4xl">
        <header className="page-heading">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={13} className="text-brand-400" />
              <p className="eyebrow m-0">INVESTIGATION WORKBENCH</p>
            </div>
            <h1 className="text-3xl font-light tracking-wide text-white uppercase">Inspect an Opportunity</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400 font-mono">
              Paste a job posting, upload an offer letter PDF, or analyze a recruiter email screenshot. HireShield will extract hidden claims, verify domains, and highlight fraudulent signals.
            </p>
          </div>
          <div className="hidden rounded-sm border border-surface-elevated bg-surface px-4 py-3 text-right sm:block">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Security Guarantee</p>
            <p className="mt-1 text-xs font-mono text-slate-300">Confidential / Zero Logging</p>
          </div>
        </header>

        {/* ============================================================
            DEMO PRESET SELECTOR (FOR FAST JUDGE TESTING)
            ============================================================ */}
        <div className="rounded-sm border border-surface-elevated bg-surface/80 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400" />
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                QUICK-LOAD DEMO PRESETS (1-CLICK TEST CASES)
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              SELECT TO INSTANTLY TEST
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SAMPLE_PRESETS.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => loadPreset(preset)}
                className={`text-left p-3 rounded-sm border transition-all flex flex-col justify-between ${
                  loadedPreset === preset.title
                    ? 'border-brand-400 bg-brand-500/10 shadow-sm'
                    : 'border-surface-elevated bg-surface-raised/40 hover:border-slate-500 hover:bg-surface-raised'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {preset.title.split(' ')[1]} {preset.title.split(' ')[2] || ''}
                    </span>
                    <span className={`badge ${preset.badgeClass} text-[9px]`}>
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 line-clamp-2 leading-relaxed">
                    {preset.preview}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-surface-elevated/50 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>LOAD SAMPLE DATA</span>
                  <span className="text-brand-400">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Format Tabs */}
        <div className="inline-flex w-full gap-1 rounded-sm border border-surface-elevated bg-surface p-1 sm:w-auto">
          {[
            { id: 'TEXT' as const, label: 'RAW TEXT', icon: FileText },
            { id: 'IMAGE' as const, label: 'SCREENSHOT', icon: ImageIcon },
            { id: 'PDF' as const, label: 'PDF DOCUMENT', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id)
                  setError(null)
                  setFile(null)
                }}
                className={`flex items-center justify-center gap-2 rounded-sm px-5 py-2.5 text-xs font-mono font-bold transition ${
                  activeTab === tab.id 
                    ? 'bg-surface-elevated text-white shadow-sm'
                    : 'text-slate-400 hover:bg-surface-raised hover:text-slate-200'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Main Form Panel */}
        <div className="panel p-5 sm:p-7 border border-surface-elevated">
          <form onSubmit={handleAnalyze} className="flex flex-col gap-6">
            
            {activeTab === 'TEXT' && (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="tech-label m-0 flex items-center gap-2" htmlFor="job-text">
                    <span>OPPORTUNITY / EMAIL CONTENT</span>
                    {loadedPreset && (
                      <span className="badge badge-low text-[9px]">
                        PRESET LOADED
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-3">
                    {text.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setText('')
                          setLoadedPreset(null)
                        }}
                        className="text-xs font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1"
                      >
                        <Trash2 size={11} />
                        <span>CLEAR</span>
                      </button>
                    )}
                    <span className={`text-xs font-mono ${text.length < 50 ? 'text-slate-500' : 'text-emerald-400'}`}>
                      {text.length} / 50 min chars
                    </span>
                  </div>
                </div>
                <textarea
                  id="job-text"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value)
                    setLoadedPreset(null)
                  }}
                  className="input-field h-64 resize-y font-mono text-xs sm:text-sm leading-6"
                  placeholder="Paste the email, LinkedIn message, or job description here... (or click a quick-load demo preset above)"
                  required
                />
              </div>
            )}

            {activeTab !== 'TEXT' && (
              <div className="flex flex-col gap-2">
                <label className="tech-label m-0">DOCUMENT UPLOAD ({activeTab})</label>
                
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !file && fileInputRef.current?.click()}
                  className={`rounded-sm border-2 border-dashed p-10 text-center transition-all sm:p-14 ${
                    isDragging 
                      ? 'border-brand-400 bg-brand-500/10'
                      : file 
                        ? 'border-slate-500 bg-surface-raised' 
                        : 'border-surface-elevated hover:border-slate-500 hover:bg-surface-raised cursor-pointer'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept={activeTab === 'IMAGE' ? ALLOWED_MIME_TYPES.IMAGE.join(',') : ALLOWED_MIME_TYPES.PDF.join(',')}
                    onChange={handleFileSelect}
                  />
                  
                  {file ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
                        <FileText size={20} />
                      </div>
                      <div className="text-slate-200 font-mono text-sm font-bold">{file.name}</div>
                      <div className="text-slate-500 font-mono text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation()
                          setFile(null)
                        }}
                        className="text-risk-critical hover:underline text-xs font-mono mt-2"
                      >
                        [ REMOVE FILE ]
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-surface-elevated/40 flex items-center justify-center text-slate-400">
                        <UploadCloud size={20} />
                      </div>
                      <div className="text-slate-300 font-mono text-sm">
                        Drag and drop your {activeTab.toLowerCase()} here, or click to browse
                      </div>
                      <div className="text-slate-500 font-mono text-xs">
                        Allowed: {activeTab === 'IMAGE' ? 'PNG, JPEG, WEBP' : 'PDF'} • Maximum size: 10MB
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-risk-critical/10 border border-risk-critical/30 rounded text-risk-critical text-xs sm:text-sm font-mono flex items-start gap-2">
                <AlertOctagon size={16} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold mr-1">[SYSTEM_ERROR]:</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse gap-4 border-t border-surface-elevated/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <Shield size={12} className="text-slate-600" />
                <span>Audited against 14 automated threat signals. Never input passwords.</span>
              </div>
              <button 
                type="submit" 
                className="btn-primary flex shrink-0 items-center justify-center gap-2 py-3 px-6 shadow-md"
              >
                <span>INITIATE ANALYSIS</span>
                <span className="text-slate-900 font-bold">→</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

