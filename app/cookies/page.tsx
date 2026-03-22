"use client";

import Link from "next/link";
import { useEffect } from "react";

const Cookies = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen">
      <section className="pt-28 pb-16" style={{ backgroundColor: "hsl(var(--background))" }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>Cookie Policy</h1>
          <p className="font-bold" style={{ color: "hsl(var(--muted-foreground))" }}>Yes, we use cookies. No, not the jollof kind. Last updated: March 1, 2026.</p>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: "hsl(var(--background))" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-10 font-medium text-sm leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.8)" }}>
            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>What cookies we use</h2>
              <ul className="list-disc pl-5 space-y-3">
                <li><strong>Essential cookies</strong> — Required for the service to work. Authentication, session management, security tokens. Can't be disabled.</li>
                <li><strong>Analytics cookies</strong> — Help us understand how people use URI Social so we can improve. Anonymous.</li>
                <li><strong>Preference cookies</strong> — Remember your settings: theme, language, notification preferences.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>What we DON'T do</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>We do NOT use advertising cookies</li>
                <li>We do NOT sell cookie data to third parties</li>
                <li>We do NOT track you across other websites</li>
                <li>We do NOT use cookies for retargeting</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>Managing cookies</h2>
              <p>You can manage cookies through your browser settings. Disabling essential cookies may affect service functionality. Disabling analytics cookies has no impact on your experience.</p>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>Contact</h2>
              <p>For cookie questions, reach us at <a href="mailto:privacy@uricreative.com" className="hover:underline" style={{ color: "hsl(var(--primary))" }}>privacy@uricreative.com</a></p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Cookies;
