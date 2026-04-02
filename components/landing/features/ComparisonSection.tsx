const ComparisonSection = () => {
  const columns = [
    {
      title: 'DIY',
      subtitle: 'Doing it yourself',
      highlighted: false,
      color: 'rgba(239, 68, 68, 0.05)',
      borderColor: '#EF4444',
      rows: [
        { label: 'Hours spent/week', value: '10-15', bad: true },
        { label: 'Cost', value: 'Your sanity', bad: true },
        { label: 'Brand consistency', value: 'Depends on your mood', bad: true },
        { label: 'Trending awareness', value: 'You find out 3 days late', bad: true },
      ],
      verdict: 'You have a business to run.',
      badge: null,
    },
    {
      title: 'AGENCY',
      subtitle: 'Hiring a freelancer/agency',
      highlighted: false,
      color: 'rgba(255, 193, 7, 0.05)',
      borderColor: 'hsl(45, 100%, 51%)',
      rows: [
        { label: 'Hours saved', value: 'Most of them', bad: false },
        { label: 'Cost', value: '₦150K-₦500K/month', bad: true },
        { label: 'Brand consistency', value: 'Takes 3 months', bad: true },
        { label: 'Trending awareness', value: '12 other clients', bad: true },
      ],
      verdict: 'Expensive. Not their only priority.',
      badge: null,
    },
    {
      title: 'JANE',
      subtitle: 'Hiring Jane',
      highlighted: true,
      color: 'rgba(203, 42, 124, 0.05)',
      borderColor: 'hsl(340, 74%, 42%)',
      rows: [
        { label: 'Hours saved', value: 'All of them', bad: false },
        { label: 'Cost', value: 'From ₦15,000/mo', bad: false },
        { label: 'Brand consistency', value: 'Learned in 5 mins', bad: false },
        { label: 'Trending awareness', value: 'Real-time, 24/7', bad: false },
      ],
      verdict: 'No brainer, honestly.',
      badge: 'WINNER!',
    },
  ];

  return (
    <section className="py-16 lg:py-20 halftone-bg" style={{ backgroundColor: 'white' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color: 'black' }}>
            LET'S BE REAL. <span className="highlight-strip">WHAT ARE YOUR OTHER OPTIONS?</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {columns.map((col, i) => (
            <div
              key={i}
              className={`comic-panel relative ${col.highlighted ? 'transform scale-105 md:scale-110 z-10' : ''}`}
              style={{ backgroundColor: col.color, borderColor: col.borderColor }}
            >
              {col.badge && (
                <div
                  className="absolute -top-4 -right-2 action-word z-20"
                  style={{
                    fontSize: '14px',
                    transform: 'rotate(8deg)',
                    backgroundColor: 'hsl(122, 39%, 49%)',
                    color: 'white',
                  }}
                >
                  {col.badge}
                </div>
              )}

              <div className="p-6">
                <h3 className="text-2xl font-black text-center mb-1 uppercase" style={{ color: 'black' }}>
                  {col.title}
                </h3>
                <p
                  className="text-xs text-center mb-5 font-bold uppercase tracking-wider"
                  style={{ color: 'rgba(0, 0, 0, 0.5)' }}
                >
                  {col.subtitle}
                </p>

                <hr className="comic-divider mb-4" />

                <div className="space-y-3 mb-5">
                  {col.rows.map((row, j) => (
                    <div key={j}>
                      <p
                        className="text-xs uppercase tracking-wider font-black"
                        style={{ color: 'rgba(0, 0, 0, 0.5)' }}
                      >
                        {row.label}
                      </p>
                      <p className="text-sm font-black" style={{ color: row.bad ? '#EF4444' : 'hsl(122, 39%, 49%)' }}>
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-4" style={{ borderTop: '3px solid black' }}>
                  <p
                    className="text-sm font-black italic"
                    style={{ color: col.highlighted ? 'hsl(340, 74%, 42%)' : 'rgba(0, 0, 0, 0.5)' }}
                  >
                    {col.verdict}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
