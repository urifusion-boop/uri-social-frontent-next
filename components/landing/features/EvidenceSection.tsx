import ProofCard from '@/components/landing/shared/ProofCard';

const EvidenceSection = () => {
  return (
    <section className="py-16 lg:py-20 halftone-bg-light" style={{ backgroundColor: 'hsl(12, 100%, 98%)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-3" style={{ color: 'black' }}>
            THE KIND OF NUMBERS <span className="highlight-strip">WE TRACK FOR YOU.</span>
          </h2>
          <p className="text-sm font-bold" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
            Illustrative examples — real customer results coming soon.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <ProofCard
            metrics={[{ value: '[X]', label: 'Qualified leads' }]}
            context="For a Lagos restaurant running one weekend campaign on Uri."
          />
          <ProofCard
            metrics={[
              { value: '₦[X]', label: 'Spent' },
              { value: '[Y]', label: 'Conversations' },
              { value: '[Z]', label: 'Sales' },
            ]}
            context="The full funnel Uri tracks automatically, end to end."
          />
          <ProofCard
            metrics={[{ value: '₦[X]', label: 'Cost per customer' }]}
            context="Not cost per click. Cost per person who actually bought."
          />
        </div>
      </div>
    </section>
  );
};

export default EvidenceSection;
