interface ProofMetric {
  value: string;
  label: string;
}

interface ProofCardProps {
  metrics: ProofMetric[];
  context: string;
  isPlaceholder?: boolean;
}

/**
 * Reusable "CUSTOMER RESULT" / "CAMPAIGN RESULT" proof card (brief §13).
 * No verified customer data exists yet, so every usage today passes
 * isPlaceholder (the default) and bracketed values like "[X]" rather than
 * an invented-looking number — swap in real metrics and isPlaceholder=false
 * once a verified result is available, and the dashed/"EXAMPLE" treatment
 * drops away automatically.
 */
const ProofCard = ({ metrics, context, isPlaceholder = true }: ProofCardProps) => {
  return (
    <div
      className="comic-panel p-5 relative"
      style={{
        backgroundColor: 'white',
        borderStyle: isPlaceholder ? 'dashed' : 'solid',
      }}
    >
      {isPlaceholder && (
        <span
          className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'hsl(45, 100%, 51%)', border: '2px solid black', color: 'black' }}
        >
          Example
        </span>
      )}
      <div className="flex items-end gap-4 flex-wrap mb-2">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className="text-2xl font-black" style={{ color: 'hsl(340, 74%, 42%)' }}>
              {metric.value}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
              {metric.label}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs font-medium" style={{ color: 'rgba(0, 0, 0, 0.55)' }}>
        {context}
      </p>
    </div>
  );
};

export default ProofCard;
