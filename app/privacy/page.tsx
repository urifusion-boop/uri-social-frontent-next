"use client";

import Link from "next/link";
import { useEffect } from "react";

const Privacy = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen">
      <section className="pt-28 pb-16" style={{ backgroundColor: "hsl(var(--background))" }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>Privacy Policy</h1>
          <p className="font-bold" style={{ color: "hsl(var(--muted-foreground))" }}>The legal stuff, written as clearly as we can. Last updated: March 1, 2026.</p>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: "hsl(var(--background))" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-sm max-w-none">
          <div className="space-y-10 font-medium text-sm leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.8)" }}>
            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>1. What We Collect</h2>
              <p>When you use URI Social, we collect:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li><strong>Account information:</strong> your name, email address, and password</li>
                <li><strong>Brand information:</strong> your brand name, logo, colors, voice preferences, content pillars, and guardrails you provide during onboarding</li>
                <li><strong>Social media data:</strong> posts, engagement metrics, and audience data from platforms you connect (via official APIs)</li>
                <li><strong>Usage data:</strong> how you interact with the workspace, which features you use, and your approval/rejection patterns</li>
                <li><strong>Payment information:</strong> processed securely through Paystack/Flutterwave — we never store your full card details</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>2. How We Use Your Data</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>To provide Jane's services: content generation, publishing, analytics, and social inbox management</li>
                <li>To improve content quality: your approvals, revisions, and rejections train Jane to better match your brand voice</li>
                <li>To send you notifications: post approvals, performance memos, trend alerts</li>
                <li>To improve our product: anonymized, aggregated usage data helps us build better features</li>
                <li><strong>We NEVER sell your data. We NEVER use your brand content to train AI models for other users.</strong></li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>3. Data Storage & Security</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
                <li>Social media API tokens are stored with additional encryption</li>
                <li>We conduct regular security audits</li>
                <li>Access to user data is restricted to essential team members under strict access controls</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>4. Third-Party Services</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Social media platform APIs (Meta, X, LinkedIn, TikTok, Pinterest, Google) for publishing and analytics</li>
                <li>Paystack/Flutterwave for payment processing</li>
                <li>Cloud hosting providers for infrastructure</li>
                <li>Analytics tools for anonymous product usage tracking</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>5. Your Rights</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Access all your data at any time from the dashboard</li>
                <li>Export your data in standard formats</li>
                <li>Delete your account and all associated data</li>
                <li>Revoke social media connections at any time</li>
                <li>Opt out of non-essential communications</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>6. Data Retention</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Active accounts: data retained as long as your account is active</li>
                <li>Cancelled accounts: data retained for 30 days, then permanently deleted</li>
                <li>You can request immediate deletion by contacting support@urisocial.com</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>7. Contact</h2>
              <p>For privacy questions: <a href="mailto:privacy@uricreative.com" className="hover:underline" style={{ color: "hsl(var(--primary))" }}>privacy@uricreative.com</a></p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Privacy;
