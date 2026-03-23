"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  const handlePricingClick = (e: React.MouseEvent) => {
    if (isHomePage) {
      e.preventDefault();
      setOpen(false);
      document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: 'rgba(252, 243, 239, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '3px solid black'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 group">
            <div className="relative">
              <Image
                src="/images/uri-logo.png"
                alt="URI Social"
                width={32}
                height={32}
                className="h-8 w-auto transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight" style={{ color: 'black' }}>
                URI
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
                Social
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/how-she-works"
              className="text-xs font-bold uppercase tracking-wide transition-colors duration-150"
              style={{ color: 'rgba(0, 0, 0, 0.7)' }}
            >
              How It Works
            </Link>
            <Link
              href="/#pricing"
              onClick={handlePricingClick}
              className="text-xs font-bold uppercase tracking-wide transition-colors duration-150"
              style={{ color: 'rgba(0, 0, 0, 0.7)' }}
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="text-xs font-bold uppercase tracking-wide transition-colors duration-150"
              style={{ color: 'rgba(0, 0, 0, 0.7)' }}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-xs font-bold uppercase tracking-wide transition-colors duration-150"
              style={{ color: 'rgba(0, 0, 0, 0.7)' }}
            >
              Contact
            </Link>
            <Link
              href="/login"
              className="text-xs font-bold uppercase tracking-wide transition-colors duration-150"
              style={{ color: 'rgba(0, 0, 0, 0.7)' }}
            >
              Sign In
            </Link>
            <Link href="/login?tab=signup" className="comic-btn px-4 py-2 rounded-lg text-xs" style={{ backgroundColor: 'hsl(340, 74%, 42%)', color: 'white' }}>
              Get Started Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors"
            onClick={() => setOpen(!open)}
            style={{ color: 'black' }}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden py-4 space-y-3"
            style={{ borderTop: '3px solid black', backgroundColor: 'rgba(252, 243, 239, 1)' }}
          >
            <Link
              href="/how-she-works"
              className="block w-full text-left text-sm font-bold py-2 px-4 uppercase"
              style={{ color: 'rgba(0, 0, 0, 0.7)' }}
              onClick={() => setOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="/#pricing"
              onClick={handlePricingClick}
              className="block w-full text-left text-sm font-bold py-2 px-4 uppercase"
              style={{ color: 'rgba(0, 0, 0, 0.7)' }}
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="block w-full text-left text-sm font-bold py-2 px-4 uppercase"
              style={{ color: 'rgba(0, 0, 0, 0.7)' }}
              onClick={() => setOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="block w-full text-left text-sm font-bold py-2 px-4 uppercase"
              style={{ color: 'rgba(0, 0, 0, 0.7)' }}
              onClick={() => setOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="/login"
              className="block w-full text-left text-sm font-bold py-2 px-4 uppercase"
              style={{ color: 'rgba(0, 0, 0, 0.7)' }}
              onClick={() => setOpen(false)}
            >
              Sign In
            </Link>
            <Link href="/login?tab=signup" className="block w-full comic-btn px-5 py-2.5 rounded-lg text-sm text-center" style={{ backgroundColor: 'hsl(340, 74%, 42%)', color: 'white' }} onClick={() => setOpen(false)}>
              Get Started Free
            </Link>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
