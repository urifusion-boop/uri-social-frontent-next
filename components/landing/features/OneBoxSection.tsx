import Image from 'next/image';

// Screenshot of the real workspace "Customer Messages" page, taken in inbox demo
// mode (NEXT_PUBLIC_INBOX_DEMO=true), so every conversation shown is sample data.
const points = [
  {
    title: 'Every conversation, one box',
    desc: 'DMs, comments and chats from your channels land in one inbox. No more jumping between apps to find who asked what.',
    color: 'hsl(340, 74%, 42%)',
  },
  {
    title: 'Sorted before you open it',
    desc: 'Sales, support, complaints and ad responses each get their own queue, so urgent customers never wait behind a "hi".',
    color: 'hsl(282, 67%, 38%)',
  },
  {
    title: 'Jane drafts the reply',
    desc: 'She suggests answers grounded in your product catalogue and policies. Edit it, or hit "Use & Send".',
    color: 'hsl(122, 39%, 49%)',
  },
];

const OneBoxSection = () => {
  return (
    <section className="py-16 lg:py-20 halftone-bg" style={{ backgroundColor: 'white' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4"
            style={{ color: 'black', transform: 'rotate(-1deg)' }}
          >
            ONE BOX. <span className="highlight-strip">EVERY CUSTOMER.</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto font-medium" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            Instagram, Facebook, WhatsApp — every enquiry in one place, with Jane ready to reply. No buyer slips away to
            whoever answered first.
          </p>
        </div>

        <div className="relative">
          <div className="comic-panel overflow-hidden" style={{ backgroundColor: 'white' }}>
            {/* Browser header */}
            <div
              className="px-4 sm:px-5 py-2 flex items-center gap-2"
              style={{ backgroundColor: 'black', color: 'white', borderBottom: '3px solid black' }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(45, 100%, 51%)' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(122, 39%, 49%)' }} />
              <span className="text-xs font-black ml-3 uppercase tracking-wider truncate">
                URI SOCIAL — CUSTOMER MESSAGES
              </span>
            </div>
            <Image
              src="/images/unified-inbox.jpg"
              alt="Uri's unified inbox: conversations from Instagram, Facebook and WhatsApp in one list, sorted into queues, with an AI suggested reply ready to send"
              width={2880}
              height={1720}
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="w-full h-auto block"
            />
          </div>

          {/* Floating action words */}
          <div
            className="absolute -top-4 -right-2 sm:-right-4 action-word !text-xs hidden sm:block"
            style={{ transform: 'rotate(6deg)' }}
          >
            REPLIED!
          </div>
          <div
            className="absolute -bottom-4 -left-2 sm:-left-4 action-word !text-xs hidden sm:block"
            style={{ backgroundColor: 'hsl(122, 39%, 49%)', color: 'white', transform: 'rotate(-6deg)' }}
          >
            LEAD SAVED!
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {points.map((point) => (
            <div key={point.title} className="comic-panel p-5" style={{ backgroundColor: 'white' }}>
              <div
                className="w-3 h-3 rounded-full mb-3"
                style={{ backgroundColor: point.color, border: '2px solid black' }}
              />
              <h3 className="text-base font-black uppercase mb-2" style={{ color: 'black' }}>
                {point.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                {point.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OneBoxSection;
