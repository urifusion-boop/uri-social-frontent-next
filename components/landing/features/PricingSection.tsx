const PricingSection = () => {
  const plans = [
    {
      name: 'Intern',
      price: 'Free',
      period: '',
      desc: 'Just getting started',
      features: ['3 social accounts', '30 AI posts/month', 'Dashboard approval only', 'Basic analytics'],
      cta: 'Start Free',
      popular: false,
    },
    {
      name: 'Full-Time',
      price: '₦15,000',
      period: '/mo',
      desc: 'The real deal',
      features: [
        'Unlimited accounts',
        'Unlimited AI posts',
        'WhatsApp + Email + Dashboard approval',
        'Social inbox & customer messages',
        'Trend monitoring & competitor watching',
        'Weekly performance memos',
        'Team access (up to 5 members)',
      ],
      cta: 'Hire Jane →',
      popular: true,
    },
    {
      name: 'Executive',
      price: '₦50,000',
      period: '/mo',
      desc: 'Enterprise energy',
      features: [
        'Everything in Full-Time',
        'Multi-brand management',
        'API access & custom integrations',
        'Priority support',
        'Dedicated onboarding session',
        'Advanced analytics & exports',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <section
      id="pricing"
      className="py-16 lg:py-20 halftone-bg-light"
      style={{ backgroundColor: 'hsl(12, 100%, 98%)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color: 'black' }}>
            WHAT'S THE DAMAGE?{' '}
            <span className="text-2xl sm:text-3xl" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
              (SPOILER: LESS THAN YOU THINK)
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`comic-panel relative ${plan.popular ? 'transform scale-105 z-10' : ''}`}
              style={{
                backgroundColor: plan.popular ? 'rgba(203, 42, 124, 0.05)' : 'white',
                borderColor: plan.popular ? 'hsl(340, 74%, 42%)' : 'black',
              }}
            >
              {plan.popular && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 action-word"
                  style={{ fontSize: '11px', transform: 'translateX(-50%) rotate(-3deg)' }}
                >
                  MOST POPULAR
                </div>
              )}
              {plan.name === 'Executive' && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 action-word"
                  style={{
                    fontSize: '11px',
                    transform: 'translateX(-50%) rotate(2deg)',
                    backgroundColor: 'black',
                    color: 'white',
                  }}
                >
                  FOR TEAMS
                </div>
              )}

              <div className="p-6 pt-8">
                <h3 className="text-2xl font-black uppercase mb-1" style={{ color: 'black' }}>
                  {plan.name}
                </h3>
                <p className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
                  {plan.desc}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-black" style={{ color: 'black' }}>
                    {plan.price}
                  </span>
                  <span className="text-sm font-bold" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
                    {plan.period}
                  </span>
                </div>

                <hr className="comic-divider mb-5" />

                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm flex items-start gap-2 font-medium" style={{ color: 'black' }}>
                      <span className="font-black mt-0.5" style={{ color: 'hsl(122, 39%, 49%)' }}>
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-lg font-black uppercase tracking-wide text-sm comic-btn ${
                    plan.popular ? '' : ''
                  }`}
                  style={{
                    backgroundColor: plan.popular ? 'hsl(340, 74%, 42%)' : 'white',
                    color: plan.popular ? 'white' : 'black',
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <div className="speech-bubble inline-block text-sm max-w-xl mx-auto" style={{ color: 'black' }}>
            For context: a social media agency charges ₦150,000-₦500,000/month. A freelancer costs ₦80,000+. Jane starts
            at free. <strong>Free free.</strong> Not "free trial" free. Actually free.
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
