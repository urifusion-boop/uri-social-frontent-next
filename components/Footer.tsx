"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const footerLinks = {
    Product: [
      { label: "Workspace", to: "/workspace" },
      { label: "Pricing", to: "/#pricing" },
      { label: "Changelog", to: "/changelog" },
      { label: "API Docs", to: "/api-docs" },
    ],
    Company: [
      { label: "About URI", to: "/about" },
      { label: "Blog", to: "/blog" },
      { label: "Careers", to: "/careers" },
      { label: "Contact", to: "/contact" },
    ],
    Legal: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
      { label: "Cookie Policy", to: "/cookies" },
    ],
  };

  return (
    <footer className="py-16 halftone-bg-dark" style={{ backgroundColor: 'hsl(330, 40%, 7%)', color: 'white', borderTop: '4px solid black' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-1 mb-3">
              <Image src="/images/uri-logo.png" alt="URI Social" width={28} height={28} className="h-7 w-auto brightness-0 invert" />
              <span className="text-sm font-black" style={{ opacity: 0.6 }}>Social</span>
            </Link>
            <p className="text-sm mb-4 font-bold" style={{ opacity: 0.5 }}>Your AI social media manager</p>
            <div className="flex gap-3">
              {["Instagram", "X", "LinkedIn"].map((s) => (
                <span key={s} className="text-xs font-bold uppercase cursor-pointer transition-all duration-150 hover:opacity-80" style={{ opacity: 0.4, color: 'white' }}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-black mb-4 uppercase tracking-wider" style={{ color: 'white' }}>{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.to} className="text-sm font-medium transition-all duration-150 hover:opacity-100" style={{ opacity: 0.5, color: 'white' }}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr className="comic-divider mb-6" style={{ opacity: 0.2 }} />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-bold uppercase tracking-wider" style={{ opacity: 0.4, color: 'white' }}>
          <span>Made with ❤️ and jollof rice in Lagos, Nigeria</span>
          <span>© 2026 URI Creative</span>
        </div>
      </div>
    </footer>
  );
}
