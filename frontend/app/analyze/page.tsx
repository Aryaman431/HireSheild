'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

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

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      
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
        throw new Error(errorData.detail || "Analysis failed on the server.")
      }

      const data = await response.json()
      
      clearInterval(stageInterval)
      router.push(`/analyze/result/${data.job_id}`)
      
    } catch (err) {
      const error = err as Error
      clearInterval(stageInterval)
      setError(error.message || "An unexpected error occurred during analysis.")
      setIsAnalyzing(false)
      setLoadingStage(0)
    }
  }

  if (isAnalyzing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg panel p-8 flex flex-col gap-8">
          <div className="flex items-center justify-between border-b border-surface-elevated pb-4">
            <h2 className="tech-label m-0 text-brand-400 animate-pulse">SYSTEM PROCESSING</h2>
            <span className="text-xs font-mono text-slate-500">ID: PENDING</span>
          </div>
          
          <div className="space-y-4">
            {LOADING_STAGES.map((stage, idx) => {
              const isPast = idx < loadingStage;
              const isCurrent = idx === loadingStage;
              
              return (
                <div key={stage} className={`flex items-center gap-4 font-mono text-sm ${isPast ? 'text-brand-500' : isCurrent ? 'text-slate-200' : 'text-slate-600'}`}>
                  <div className="w-6 flex justify-center">
                    {isPast ? '✓' : isCurrent ? (
                      <div className="w-3 h-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    ) : '·'}
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
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-surface-elevated pb-6">
          <h1 className="text-3xl font-light tracking-wide uppercase text-brand-100">Initiate Investigation</h1>
          <p className="text-slate-400 text-sm mt-2">Submit recruitment materials for automated AI risk extraction and deterministic verification.</p>
        </header>

        <div className="flex space-x-1 border-b border-surface-elevated">
          {(['TEXT', 'IMAGE', 'PDF'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab)
                setError(null)
                setFile(null)
              }}
              className={`px-4 py-3 text-sm font-mono transition-colors ${
                activeTab === tab 
                  ? 'text-brand-400 border-b-2 border-brand-500' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              [ {tab} ]
            </button>
          ))}
        </div>

        <div className="panel p-6">
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
                  className="bg-slate-900 border border-surface-elevated rounded p-4 text-sm text-slate-300 font-mono focus:outline-none focus:border-brand-500 transition-colors h-64 resize-y"
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
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    file ? 'border-brand-500/50 bg-brand-500/5' : 'border-surface-elevated hover:border-slate-600 hover:bg-slate-900/50'
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
                      <div className="text-brand-400 font-mono text-sm">{file.name}</div>
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

            <div className="flex justify-end">
              <button type="submit" className="btn-primary flex items-center gap-2">
                <span>INITIATE ANALYSIS</span>
                <span className="text-brand-700">→</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
