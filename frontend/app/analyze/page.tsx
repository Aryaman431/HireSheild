'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { getBrowserApiUrl } from '@/lib/api'

const LOADING_STAGES = [
  "VALIDATING SOURCE",
  "EXTRACTING JOB INFORMATION",
  "IDENTIFYING COMPANY",
  "CHECKING RECRUITER",
  "ANALYZING RISK SIGNALS",
  "HISTORICAL INTELLIGENCE",
  "COMMUNITY INTELLIGENCE",
  "VERIFICATION CHECKS",
  "FINAL RISK ASSESSMENT"
]

const ALLOWED_MIME_TYPES = {
  IMAGE: ["image/png", "image/jpeg", "image/webp"],
  PDF: ["application/pdf"]
}

export default function AnalyzePage() {
  const router = useRouter()
  const { getToken } = useAuth()
  const [activeTab, setActiveTab] = useState<'TEXT' | 'IMAGE' | 'PDF'>('TEXT')
  
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [loadingStage, setLoadingStage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const validateAndSetFile = (selectedFile: File) => {
    setError(null)
    
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (activeTab === 'TEXT' && text.length < 50) {
      setError("Please paste a more comprehensive job description (at least 50 characters).")
      return
    }
    
    if (activeTab !== 'TEXT' && !file) {
      setError("Please select a file to analyze.")
      return
    }

    setIsAnalyzing(true)
    setError(null)
    
    const stageInterval = setInterval(() => {
      setLoadingStage((prev: number) => (prev < LOADING_STAGES.length - 1 ? prev + 1 : prev))
    }, 1500)

    try {
      const token = await getToken()
      if (!token) {
        throw new Error("Authentication session expired.")
      }

      const apiUrl = getBrowserApiUrl()
      
      let response;
      
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
        ? "Unable to reach the analysis service. Please make sure the backend is running."
        : error.message || "An unexpected error occurred during analysis.")
      setIsAnalyzing(false)
      setLoadingStage(0)
    }
  }

  if (isAnalyzing) {
    return (
      <div className="app-page flex items-center justify-center">
        <div className="panel flex w-full max-w-lg flex-col gap-8 p-8 border border-surface-elevated">
          <div className="flex items-center justify-between border-b border-surface-elevated pb-4">
            <h2 className="tech-label m-0 text-slate-300">SYSTEM PROCESSING</h2>
            <span className="text-xs font-mono text-slate-500">ID: PENDING</span>
          </div>
          
          <div className="space-y-4">
            {LOADING_STAGES.map((stage, idx) => {
              const isPast = idx < loadingStage;
              const isCurrent = idx === loadingStage;
              
              return (
                <div key={stage} className={`flex items-center gap-4 font-mono text-sm ${isPast ? 'text-slate-500' : isCurrent ? 'text-slate-200' : 'text-slate-700'}`}>
                  <div className="w-6 flex justify-center">
                    {isPast ? '[OK]' : isCurrent ? '[..]' : '[  ]'}
                  </div>
                  <span className={`${isCurrent ? 'animate-pulse tracking-wide' : ''}`}>
                    {String(idx + 1).padStart(2, '0')} {stage}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-page">
      <div className="page-wrap max-w-4xl">
        <header className="page-heading">
          <div>
            <p className="eyebrow">New investigation</p>
            <h1 className="text-3xl font-light tracking-wide text-white uppercase">Check an opportunity.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 font-mono">Submit a job post, recruiter email, or document. We’ll surface claims, verification evidence, and meaningful risk signals.</p>
          </div>
          <div className="hidden rounded-sm border border-surface-elevated bg-surface px-4 py-3 text-right sm:block">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Source privacy</p>
            <p className="mt-1 text-xs font-mono text-slate-300">Protected analysis</p>
          </div>
        </header>

        <div className="inline-flex w-full gap-1 rounded-sm border border-surface-elevated bg-surface p-1 sm:w-auto">
          {(['TEXT', 'IMAGE', 'PDF'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab)
                setError(null)
                setFile(null)
              }}
              className={`flex-1 rounded-sm px-5 py-2.5 text-sm font-mono font-bold transition ${
                activeTab === tab 
                  ? 'bg-surface-elevated text-white'
                  : 'text-slate-500 hover:bg-surface-raised hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="panel p-5 sm:p-7">
          <form onSubmit={handleAnalyze} className="flex flex-col gap-6">
            
            {activeTab === 'TEXT' && (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="tech-label m-0" htmlFor="job-text">RAW OPPORTUNITY TEXT</label>
                  <span className="text-xs text-slate-500 font-mono">{text.length} chars</span>
                </div>
                <textarea
                  id="job-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="input-field h-64 resize-y font-mono leading-6"
                  placeholder="Paste the email, LinkedIn message, or job description here..."
                  required
                />
              </div>
            )}

            {activeTab !== 'TEXT' && (
              <div className="flex flex-col gap-2">
                <label className="tech-label m-0">DOCUMENT UPLOAD ({activeTab})</label>
                
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`rounded-sm border-2 border-surface-elevated p-10 text-center transition-colors sm:p-14 ${
                    file ? 'border-slate-500 bg-surface-raised' : 'hover:border-slate-500 hover:bg-surface-raised'
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
                      <div className="text-slate-200 font-mono text-sm font-bold">{file.name}</div>
                      <div className="text-slate-500 font-mono text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                      <button 
                        type="button" 
                        onClick={() => setFile(null)}
                        className="text-risk-critical hover:underline text-xs font-mono mt-2"
                      >
                        [ REMOVE FILE ]
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="text-slate-400 font-mono text-sm">
                        Drag and drop your {activeTab.toLowerCase()} here, or click to browse
                      </div>
                      <div className="text-slate-600 font-mono text-xs">
                        Max Size: 10MB
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-risk-critical/10 border border-risk-critical/30 rounded text-risk-critical text-sm font-mono">
                [SYSTEM_ERROR]: {error}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-surface-elevated/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500">Analysis is evidence-led. Never share a password or banking details.</p>
              <button type="submit" className="btn-primary flex shrink-0 items-center justify-center gap-2">
                <span>INITIATE ANALYSIS</span>
                <span className="text-slate-500">→</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
