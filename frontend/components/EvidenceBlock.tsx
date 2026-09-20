export default function EvidenceBlock({ source, quote, confidence, metadata }: { source: string, quote: string, confidence?: number, metadata?: string }) {
  return (
    <div className="border border-border rounded-lg bg-surface overflow-hidden">
      <div className="bg-surface-raised px-4 py-2 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">SOURCE</span>
          <span className="text-xs font-mono text-brand-400 uppercase tracking-widest bg-brand-500/10 px-2 py-0.5 rounded">{source}</span>
        </div>
        {confidence && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">CONFIDENCE</span>
            <span className="text-xs font-mono text-text">{confidence}%</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm text-text font-mono whitespace-pre-wrap leading-relaxed">
          {quote}
        </p>
        {metadata && (
          <div className="mt-4 pt-3 border-t border-border">
            <span className="text-xs font-mono text-text-muted">{metadata}</span>
          </div>
        )}
      </div>
    </div>
  )
}
