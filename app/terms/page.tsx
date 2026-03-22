"use client";

import Link from "next/link";
import { useEffect } from "react";

const Terms = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen">
      <section className="pt-28 pb-16" style={{ backgroundColor: "hsl(var(--background))" }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>Terms of Service</h1>
          <p className="font-bold" style={{ color: "hsl(var(--muted-foreground))" }}>The rules of engagement. Last updated: March 1, 2026.</p>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: "hsl(var(--background))" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-10 font-medium text-sm leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.8)" }}>
            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>1. The Basics</h2>
              <p>URI Social is a product of URI Creative ("we", "us", "our"). By using our service, you agree to these terms. If you don't agree, please don't use the service (but we'll be sad to see you go).</p>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>2. Your Account</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>You must be at least 18 years old to use URI Social</li>
                <li>You're responsible for keeping your login credentials secure</li>
                <li>One account per person/business — don't share accounts across unrelated businesses</li>
                <li>You must provide accurate information during sign-up and onboarding</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>3. What Jane Does (and Doesn't Do)</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Jane generates content suggestions based on your brand profile and preferences</li>
                <li>All content is generated as drafts and requires your approval before publishing (unless you explicitly enable auto-publish)</li>
                <li>You are ultimately responsible for all content published through your social media accounts</li>
                <li>Jane does not guarantee specific engagement, follower growth, or business outcomes</li>
                <li>We continuously improve Jane's capabilities but cannot guarantee uninterrupted service</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>4. Your Content & Brand Data</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>You own all content generated for your brand through URI Social</li>
                <li>You own your brand profile, voice settings, and all customizations</li>
                <li>We do not claim any ownership over your content</li>
                <li>We may use anonymized, aggregated data to improve our product</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>5. Acceptable Use</h2>
              <p className="mb-2">You agree not to use URI Social to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Generate content that violates any law or regulation</li>
                <li>Publish misleading, defamatory, or harmful content</li>
                <li>Spam or engage in deceptive practices on social media platforms</li>
                <li>Attempt to reverse-engineer, hack, or abuse the service</li>
                <li>Violate the terms of service of any connected social media platform</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>6. Billing</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Free plan: no payment required, ever</li>
                <li>Paid plans: billed monthly in Nigerian Naira (₦) via Paystack/Flutterwave</li>
                <li>You can cancel at any time — no penalties, no lock-in</li>
                <li>Refunds: we offer a full refund within 14 days of your first paid subscription if you're not satisfied</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>7. Limitation of Liability</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>URI Social is provided "as is" — we do our best but can't guarantee perfection</li>
                <li>We are not liable for any content published through your accounts</li>
                <li>We are not liable for changes in social media platform APIs that may affect service</li>
                <li>Our total liability is limited to the amount you've paid us in the last 12 months</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>8. Changes to These Terms</h2>
              <p>We may update these terms occasionally. We'll notify you via email and in-app notification at least 14 days before changes take effect.</p>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: "hsl(var(--foreground))" }}>9. Contact</h2>
              <p>For legal questions: <a href="mailto:legal@uricreative.com" className="hover:underline" style={{ color: "hsl(var(--primary))" }}>legal@uricreative.com</a></p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Terms;
