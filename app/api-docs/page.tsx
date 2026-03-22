"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useEffect } from "react";

const endpoints = [
  { method: "POST", path: "/v1/posts/generate", description: "Generate a new post" },
  { method: "GET", path: "/v1/posts", description: "List all posts (draft, scheduled, published)" },
  { method: "POST", path: "/v1/posts/:id/approve", description: "Approve a post" },
  { method: "POST", path: "/v1/posts/:id/reject", description: "Reject a post" },
  { method: "GET", path: "/v1/analytics/summary", description: "Get performance summary" },
  { method: "GET", path: "/v1/analytics/posts/:id", description: "Get post-level analytics" },
  { method: "GET", path: "/v1/inbox/messages", description: "Get social inbox messages" },
  { method: "GET", path: "/v1/trends", description: "Get trending topics in your niche" },
];

const ApiDocs = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen">
      <section className="pt-28 pb-16" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="comic-headline text-4xl sm:text-5xl lg:text-6xl font-black mb-5" style={{ color: 'hsl(var(--foreground))' }}>
            Build With <span className="highlight-strip">Jane</span>
          </h1>
          <p className="font-bold text-lg max-w-2xl mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
            For developers who want to integrate Jane's capabilities into their own products. Available on the Executive plan.
          </p>
        </div>
      </section>

      <section className="py-20" style={{ backgroundColor: 'hsl(var(--card))' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Getting Started */}
          <ScrollReveal>
            <div className="comic-panel p-6" style={{ backgroundColor: 'hsl(var(--background))' }}>
              <h2 className="text-lg font-black uppercase mb-4" style={{ color: 'hsl(var(--foreground))' }}>Getting Started</h2>
              <ul className="space-y-2 text-sm font-bold" style={{ color: 'hsl(var(--foreground) / 0.7)' }}>
                <li><strong style={{ color: 'hsl(var(--foreground))' }}>Base URL:</strong> https://api.urisocial.com/v1</li>
                <li><strong style={{ color: 'hsl(var(--foreground))' }}>Auth:</strong> API keys (generated in HR & Payroll → API Access)</li>
                <li><strong style={{ color: 'hsl(var(--foreground))' }}>Rate limits:</strong> 100 requests/minute on Executive plan</li>
                <li><strong style={{ color: 'hsl(var(--foreground))' }}>Response format:</strong> JSON</li>
              </ul>
            </div>
          </ScrollReveal>

          {/* Code Example */}
          <ScrollReveal>
            <div className="comic-panel p-6" style={{ backgroundColor: 'hsl(var(--foreground))' }}>
              <pre className="text-sm font-mono overflow-x-auto whitespace-pre" style={{ color: 'hsl(var(--background))' }}>
{`POST /v1/posts/generate
{
  "brand_id": "bloom-coffee",
  "platform": "instagram",
  "pillar": "product-highlights",
  "topic": "New Ethiopian blend launch",
  "format": "carousel"
}`}
              </pre>
            </div>
          </ScrollReveal>

          {/* Endpoints */}
          <ScrollReveal>
            <div className="comic-panel p-6" style={{ backgroundColor: 'hsl(var(--background))' }}>
              <h2 className="text-lg font-black uppercase mb-4" style={{ color: 'hsl(var(--foreground))' }}>Endpoints</h2>
              <div className="space-y-3">
                {endpoints.map((e, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span
                      className={`font-mono font-black shrink-0 px-2 py-0.5 rounded text-xs`}
                      style={{
                        backgroundColor: e.method === "GET" ? 'hsl(var(--uri-blue) / 0.1)' : 'hsl(var(--uri-green) / 0.1)',
                        color: e.method === "GET" ? 'hsl(var(--uri-blue))' : 'hsl(var(--uri-green))'
                      }}
                    >
                      {e.method}
                    </span>
                    <code className="font-mono font-bold" style={{ color: 'hsl(var(--foreground))' }}>{e.path}</code>
                    <span className="font-bold" style={{ color: 'hsl(var(--foreground) / 0.5)' }}>— {e.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* CTA */}
          <ScrollReveal>
            <div className="comic-panel p-6 text-center" style={{ backgroundColor: 'hsl(var(--primary) / 0.05)', borderColor: 'hsl(var(--primary))' }}>
              <h3 className="text-base font-black uppercase mb-2" style={{ color: 'hsl(var(--foreground))' }}>Full documentation coming soon</h3>
              <p className="text-sm font-bold mb-4" style={{ color: 'hsl(var(--foreground) / 0.7)' }}>Want early access?</p>
              <button className="comic-btn px-6 py-3 rounded-lg text-sm" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>Join the API Waitlist →</button>
              <p className="text-xs font-bold mt-4" style={{ color: 'hsl(var(--muted-foreground))' }}>The API is available on the Executive plan (₦50,000/mo).</p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default ApiDocs;
