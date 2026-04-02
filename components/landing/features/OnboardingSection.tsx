const OnboardingSection = () => {
  const steps = [
    {
      num: 1,
      title: 'Teach her your vibe',
      desc: 'Upload your logo. Pick your colors. Take a 60-second brand personality quiz (are you "Witty & Playful" or "Polished & Professional"?). Jane learns your entire visual identity and voice before her first day is over.',
      illustration: (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="20" width="50" height="40" rx="4" fill="hsl(207, 90%, 54%)" stroke="black" strokeWidth="3" />
          <rect x="22" y="28" width="16" height="16" rx="2" fill="hsl(340, 74%, 42%)" stroke="black" strokeWidth="2" />
          <rect x="42" y="28" width="16" height="6" rx="1" fill="hsl(45, 100%, 51%)" stroke="black" strokeWidth="1.5" />
          <rect x="42" y="38" width="16" height="6" rx="1" fill="hsl(122, 39%, 49%)" stroke="black" strokeWidth="1.5" />
          <path d="M35 10 L40 18 L30 18 Z" fill="hsl(45, 100%, 51%)" stroke="black" strokeWidth="2" />
        </svg>
      ),
      tags: ['Witty & Playful', 'Polished & Professional', 'Bold & Confident', 'Warm & Friendly'],
    },
    {
      num: 2,
      title: 'Give her the playbook',
      desc: 'Set your content pillars (Behind the Scenes, Product Highlights, Tips & Education). Choose your platforms. Tell her what to never talk about. Define your posting rhythm. Done.',
      illustration: (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="15" width="50" height="55" rx="4" fill="white" stroke="black" strokeWidth="3" />
          <rect x="24" y="24" width="12" height="8" rx="2" fill="hsl(122, 39%, 49%)" stroke="black" strokeWidth="1.5" />
          <line x1="40" y1="28" x2="56" y2="28" stroke="black" strokeWidth="2" />
          <rect x="24" y="38" width="12" height="8" rx="2" fill="hsl(282, 67%, 38%)" stroke="black" strokeWidth="1.5" />
          <line x1="40" y1="42" x2="56" y2="42" stroke="black" strokeWidth="2" />
          <rect x="24" y="52" width="12" height="8" rx="2" fill="hsl(45, 100%, 51%)" stroke="black" strokeWidth="1.5" />
          <line x1="40" y1="56" x2="56" y2="56" stroke="black" strokeWidth="2" />
          <path d="M28 26 L31 29 L36 24" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      tags: ['Behind the Scenes', 'Product Highlights', 'Tips & Education', 'Promos'],
    },
    {
      num: 3,
      title: 'Let her cook',
      desc: 'Jane drafts posts. You approve from WhatsApp, email, or the dashboard. She publishes at the perfect time. You go back to running your business.',
      illustration: (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="10" width="40" height="60" rx="6" fill="hsl(122, 39%, 49%)" stroke="black" strokeWidth="3" />
          <rect x="26" y="18" width="28" height="36" rx="2" fill="white" stroke="black" strokeWidth="1.5" />
          <text x="40" y="40" textAnchor="middle" fill="black" fontSize="10" fontWeight="900">
            ✓
          </text>
          <circle cx="40" cy="62" r="4" fill="white" stroke="black" strokeWidth="1.5" />
        </svg>
      ),
      tags: [],
      whatsapp: true,
    },
  ];

  return (
    <section
      id="how-she-works"
      className="py-16 lg:py-20 halftone-bg-light"
      style={{ backgroundColor: 'hsl(12, 100%, 98%)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4"
            style={{ color: 'black', transform: 'rotate(-1deg)' }}
          >
            GET HER UP TO SPEED IN <span className="highlight-strip">5 MINUTES.</span>
          </h2>
          <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
            SHE'S A FAST LEARNER.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Dashed connector lines */}
          <div
            className="hidden md:block absolute top-24 left-[33%] w-[10%]"
            style={{ borderTop: '4px dashed black', transform: 'rotate(2deg)' }}
          />
          <div
            className="hidden md:block absolute top-24 right-[23%] w-[10%]"
            style={{ borderTop: '4px dashed black', transform: 'rotate(-2deg)' }}
          />

          {steps.map((step) => (
            <div
              key={step.num}
              className="comic-panel transition-shadow duration-150 hover:shadow-lg"
              style={{ backgroundColor: 'white' }}
            >
              <div className="p-6">
                {/* Step number */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black"
                    style={{
                      backgroundColor: 'hsl(340, 74%, 42%)',
                      border: '3px solid black',
                      color: 'white',
                    }}
                  >
                    {step.num}
                  </div>
                </div>

                {/* Illustration */}
                <div className="flex justify-center mb-4">{step.illustration}</div>

                <h3 className="text-xl font-black uppercase mb-2" style={{ color: 'black' }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                  {step.desc}
                </p>

                {/* Tags */}
                {step.tags.length > 0 && (
                  <div className="mt-4 flex gap-2 flex-wrap">
                    {step.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-bold px-3 py-1.5 rounded-full"
                        style={{
                          backgroundColor: step.num === 1 ? 'rgba(203, 42, 124, 0.1)' : 'rgba(136, 58, 152, 0.1)',
                          color: step.num === 1 ? 'hsl(340, 74%, 42%)' : 'hsl(282, 67%, 38%)',
                          border: `1px solid ${step.num === 1 ? 'rgba(203, 42, 124, 0.2)' : 'rgba(136, 58, 152, 0.2)'}`,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* WhatsApp mockup */}
                {step.whatsapp && (
                  <div
                    className="mt-4 comic-panel"
                    style={{
                      backgroundColor: 'rgba(76, 175, 80, 0.05)',
                      borderColor: 'hsl(122, 39%, 49%)',
                      boxShadow: '3px 3px 0px hsl(122, 39%, 49%)',
                    }}
                  >
                    <div className="p-3">
                      <p className="text-xs font-black mb-1 uppercase" style={{ color: 'hsl(122, 39%, 49%)' }}>
                        WHATSAPP · JUST NOW
                      </p>
                      <p className="text-sm font-bold" style={{ color: 'black' }}>
                        Jane: "Your Instagram post is ready! Reply <strong>1</strong> to approve, <strong>2</strong> to
                        revise."
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button
            className="comic-btn px-8 py-4 rounded-lg text-base"
            style={{ backgroundColor: 'hsl(340, 74%, 42%)', color: 'white' }}
          >
            SOUNDS GOOD. HIRE HER →
          </button>
        </div>
      </div>
    </section>
  );
};

export default OnboardingSection;
