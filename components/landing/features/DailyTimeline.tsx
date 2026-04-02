const DailyTimeline = () => {
  const timeline = [
    {
      time: '6:00 AM',
      text: "Checks what's trending in your industry. Spots a viral topic before your competitors do.",
      color: 'rgba(255, 193, 7, 0.1)',
      actionWord: null,
    },
    {
      time: '8:00 AM',
      text: 'Drafts 3 posts tailored to your brand voice. Queues them in your approval inbox.',
      color: 'rgba(33, 150, 243, 0.1)',
      actionWord: null,
    },
    {
      time: '9:15 AM',
      text: 'You approve 2 posts from WhatsApp while drinking your morning coffee. Takes 30 seconds.',
      color: 'rgba(76, 175, 80, 0.1)',
      actionWord: 'APPROVED!',
    },
    {
      time: '10:00 AM',
      text: 'Publishes your first post at the optimal time for your audience. Hashtags selected. Caption perfect.',
      color: 'rgba(203, 42, 124, 0.05)',
      actionWord: 'POSTED!',
    },
    {
      time: '1:00 PM',
      text: 'Flags a DM from a potential wholesale buyer. Suggests a reply in your brand voice.',
      color: 'rgba(156, 39, 176, 0.1)',
      actionWord: null,
    },
    {
      time: '4:00 PM',
      text: 'Notices your carousel post is getting 3x more saves than usual. Sends you a quick heads-up.',
      color: 'rgba(33, 150, 243, 0.1)',
      actionWord: '3x ENGAGEMENT',
    },
    {
      time: '10:00 PM',
      text: "Still working. Scheduling tomorrow's content. Monitoring overnight engagement. No overtime pay needed.",
      color: 'rgba(156, 39, 176, 0.1)',
      actionWord: null,
    },
    {
      time: 'Every Friday',
      text: "Writes you a performance memo: what worked, what didn't, and what to do next week.",
      color: 'rgba(76, 175, 80, 0.1)',
      actionWord: null,
    },
  ];

  return (
    <section className="py-16 lg:py-20 halftone-bg" style={{ backgroundColor: 'white' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4"
            style={{ color: 'black', transform: 'rotate(-1deg)' }}
          >
            A DAY IN <span className="highlight-strip">JANE'S LIFE</span>
          </h2>
          <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
            (SHE'S ALWAYS ON)
          </p>
        </div>

        <div className="relative">
          {/* Vertical timeline line */}
          <div
            className="absolute left-6 md:left-1/2 top-0 bottom-0 w-1 rounded-full"
            style={{ backgroundColor: 'black', transform: 'rotate(0.3deg) translateX(-0.5px)' }}
          />

          <div className="space-y-6">
            {timeline.map((item, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div key={i} className="relative">
                  <div className="md:grid md:grid-cols-2 md:gap-8 pl-14 md:pl-0">
                    <div className={isLeft ? 'md:text-right md:pr-8' : 'md:col-start-2 md:pl-8'}>
                      <div
                        className="comic-panel relative"
                        style={{ backgroundColor: item.color, boxShadow: '4px 4px 0px black' }}
                      >
                        <div className="comic-caption m-2" style={{ fontSize: '11px' }}>
                          {item.time}
                        </div>
                        <div className="p-4 pt-2">
                          <p className="text-sm leading-relaxed" style={{ color: 'black' }}>
                            {item.text}
                          </p>
                          {item.actionWord && (
                            <div className="mt-3 text-center">
                              <span className="action-word" style={{ fontSize: '11px' }}>
                                {item.actionWord}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Timeline dot */}
                  <div
                    className="absolute left-4 md:left-1/2 top-5 w-4 h-4 rounded-full"
                    style={{
                      backgroundColor: 'hsl(340, 74%, 42%)',
                      border: '3px solid black',
                      transform: 'translateX(-2px) md:translateX(-8px)',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DailyTimeline;
