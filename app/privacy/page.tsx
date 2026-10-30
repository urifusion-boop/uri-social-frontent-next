'use client';

import Link from 'next/link';
import { useEffect } from 'react';

const Privacy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen">
      <section className="pt-28 pb-16" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-black mb-3" style={{ color: 'hsl(var(--foreground))' }}>
            Privacy Policy
          </h1>
          <p className="font-bold" style={{ color: 'hsl(var(--muted-foreground))' }}>
            The legal stuff, written as clearly as we can. Last updated: October 30, 2026.
          </p>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-sm max-w-none">
          <div
            className="space-y-10 font-medium text-sm leading-relaxed"
            style={{ color: 'hsl(var(--foreground) / 0.8)' }}
          >
            <div>
              <p>
                Uruzi Insights Ltd (Uri Social) is committed to protecting the privacy and security of your personal
                information. This Privacy Policy outlines how we collect, use, disclose, and protect your information.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: 'hsl(var(--foreground))' }}>
                1. Information We Collect
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>
                  <strong>Personal Information:</strong> We may collect personal information such as your name, email
                  address, phone number, and payment details when you register on our App or Website, make purchases, or
                  communicate with us.
                </li>
                <li>
                  <strong>Usage Data:</strong> We collect information about your interactions with our App and Website,
                  such as the pages visited, actions taken, and error logs.
                </li>
                <li>
                  <strong>Device Information:</strong> We may collect information about the device you use to access our
                  App, including device model, operating system version, unique device identifiers, and mobile network
                  information.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: 'hsl(var(--foreground))' }}>
                2. How We Use Your Information
              </h2>
              <p>We use the information we collect for the following purposes:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>To provide and maintain our services to you</li>
                <li>To process your transactions and manage your account</li>
                <li>To improve our App and Website performance, functionality, and user experience</li>
                <li>To communicate with you, including responding to your inquiries and providing customer support</li>
                <li>
                  To send you promotional offers, updates, and marketing communications that may be of interest to you,
                  where permitted by law
                </li>
                <li>To detect, prevent, and address technical issues, fraud, or security concerns</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: 'hsl(var(--foreground))' }}>
                3. Sharing Your Information
              </h2>
              <p>We may share your information in the following circumstances:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>
                  <strong>With Service Providers:</strong> Uri may share your information with trusted service providers
                  who assist in operating our business and providing our services, including payment processors, cloud
                  hosting providers, and customer support tools.
                </li>
                <li>
                  <strong>With Third-Party Analytics and Advertising Partners:</strong> Uri may share non-personally
                  identifiable information or aggregated data with analytics and advertising partners to analyze usage
                  patterns and deliver targeted advertisements.
                </li>
                <li>
                  <strong>When Required by Law or Legal Requests:</strong> Uri may disclose your information in response
                  to valid legal requests, including subpoenas, court orders, or other legal processes.
                </li>
                <li>
                  <strong>Managing Access to Third-Party Accounts:</strong> You can manage third-party app access
                  through your account settings on Google, Meta (Facebook), TikTok, X (Twitter), and LinkedIn. Visit
                  each platform's security settings to review and revoke permissions as needed.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: 'hsl(var(--foreground))' }}>
                4. Data Transfer
              </h2>
              <p>
                Uri may transfer your personal data to countries outside of Nigeria. When doing so, we ensure compliance
                with the Nigerian Data Protection Regulation (NDPR) requirements.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>
                  <strong>Legal Basis:</strong> We only transfer data when there's a lawful basis, such as obtaining
                  your explicit consent or implementing appropriate safeguards like Standard Contractual Clauses.
                </li>
                <li>
                  <strong>Transparency and Notice:</strong> Prior to any transfer, we will inform you of the intended
                  recipients, purpose, and legal basis for the transfer.
                </li>
                <li>
                  <strong>Your Rights:</strong> You have the right to obtain a copy of any safeguards used for the
                  transfer of your personal data outside Nigeria.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: 'hsl(var(--foreground))' }}>
                5. Data Security
              </h2>
              <p>
                We take the security of your personal information seriously and have implemented robust technical and
                organizational measures to protect it.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>
                  <strong>Encryption:</strong> Data transmission is encrypted using Secure Socket Layer (SSL) technology
                </li>
                <li>
                  <strong>Access Control:</strong> Access is restricted to authorized personnel only
                </li>
                <li>
                  <strong>Data Hosting:</strong> We host our services on Microsoft Azure with stringent security
                  protocols
                </li>
                <li>
                  <strong>Monitoring:</strong> Continuous monitoring and regular security audits
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: 'hsl(var(--foreground))' }}>
                6. Your Choices and Rights
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>You may access, update, or delete your personal information by contacting us directly</li>
                <li>You may opt-out of receiving marketing communications at any time</li>
                <li>
                  Depending on your jurisdiction, you may have additional rights regarding your personal information
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: 'hsl(var(--foreground))' }}>
                7. Changes to This Privacy Policy
              </h2>
              <p>
                Uri reserves the right to update this Privacy Policy at any time. We encourage you to review it
                periodically.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>
                  <strong>Notification Methods:</strong> We will notify you through email, push notifications, or
                  prominent notices within our App/Website.
                </li>
                <li>
                  <strong>Opt-out Option:</strong> If you disagree with changes, you may discontinue using our services
                  and request deletion of your data.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: 'hsl(var(--foreground))' }}>
                8. Data Breach Procedure
              </h2>
              <p>
                Uri is committed to protecting your personal information. In the event of a data breach, we have
                established procedures in accordance with NDPR requirements.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>
                  <strong>Detection:</strong> We maintain monitoring systems to detect unauthorized access or breaches.
                </li>
                <li>
                  <strong>Investigation:</strong> Our incident response team will promptly investigate the scope and
                  impact.
                </li>
                <li>
                  <strong>Reporting:</strong> We will report breaches to the NDPRC and affected users within 72 hours of
                  becoming aware.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-black mb-3" style={{ color: 'hsl(var(--foreground))' }}>
                Questions About Your Privacy?
              </h2>
              <p>
                If you have any questions or concerns about this Privacy Policy or our data practices, please contact
                us:{' '}
                <a
                  href="mailto:hello@urisocial.com"
                  className="hover:underline"
                  style={{ color: 'hsl(var(--primary))' }}
                >
                  hello@urisocial.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Privacy;
