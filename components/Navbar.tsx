'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/src/providers/AuthProvider';
import CreditBalance from './CreditBalance';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === '/';
  const { isAuthenticated, userDetails, logoutUser } = useAuth();

  const handlePricingClick = (e: React.MouseEvent) => {
    if (isHomePage) {
      e.preventDefault();
      setOpen(false);
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getInitials = () => {
    const firstName = userDetails?.firstName || '';
    const lastName = userDetails?.lastName || '';
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) return firstName[0].toUpperCase();
    if (userDetails?.email) return userDetails.email[0].toUpperCase();
    return 'U';
  };

  const getDisplayName = () => {
    const firstName = userDetails?.firstName || '';
    const lastName = userDetails?.lastName || '';
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) return firstName;
    if (lastName) return lastName;
    return userDetails?.email?.split('@')[0] || 'User';
  };

  const handleLogout = () => {
    setProfileMenuOpen(false);
    logoutUser();
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: 'rgba(252, 243, 239, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '3px solid black',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Image
                src="/images/urilogo-nobg.png"
                alt="URI Social"
                width={44}
                height={44}
                className="h-11 w-auto transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-black tracking-tight" style={{ color: 'black' }}>
                URI
              </span>
              <span
                className="text-xs font-semibold tracking-wider uppercase"
                style={{ color: 'rgba(0, 0, 0, 0.6)', marginTop: '2px' }}
              >
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
              href="/pricing"
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

            {isAuthenticated ? (
              <>
                {/* Credit Balance - PRD 7.1 */}
                <CreditBalance />

                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/5 transition-colors"
                    style={{ border: '2px solid black' }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ backgroundColor: 'hsl(340, 74%, 42%)', color: 'white' }}
                    >
                      {getInitials()}
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'black' }}>
                      {getDisplayName()}
                    </span>
                  </button>

                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg overflow-hidden"
                        style={{ backgroundColor: 'rgba(252, 243, 239, 1)', border: '3px solid black' }}
                      >
                        <div className="p-3" style={{ borderBottom: '2px solid black' }}>
                          <p className="font-bold text-sm" style={{ color: 'black' }}>
                            {getDisplayName()}
                          </p>
                          <p className="text-xs" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                            {userDetails?.email}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setProfileMenuOpen(false);
                            router.push('/social-media');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors text-left"
                        >
                          <LayoutDashboard size={18} style={{ color: 'hsl(340, 74%, 42%)' }} />
                          <span className="text-sm font-semibold" style={{ color: 'black' }}>
                            Dashboard
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            setProfileMenuOpen(false);
                            router.push('/billing');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors text-left"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-[18px] h-[18px]"
                            style={{ color: 'hsl(340, 74%, 42%)' }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                            />
                          </svg>
                          <span className="text-sm font-semibold" style={{ color: 'black' }}>
                            Billing & Credits
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            setProfileMenuOpen(false);
                            router.push('/social-media/settings');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors text-left"
                        >
                          <Settings size={18} style={{ color: 'hsl(340, 74%, 42%)' }} />
                          <span className="text-sm font-semibold" style={{ color: 'black' }}>
                            Settings
                          </span>
                        </button>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors text-left"
                          style={{ borderTop: '2px solid black' }}
                        >
                          <LogOut size={18} style={{ color: 'hsl(340, 74%, 42%)' }} />
                          <span className="text-sm font-semibold" style={{ color: 'black' }}>
                            Logout
                          </span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-bold uppercase tracking-wide transition-colors duration-150"
                  style={{ color: 'rgba(0, 0, 0, 0.7)' }}
                >
                  Sign In
                </Link>
                <Link
                  href="/login?tab=signup"
                  className="comic-btn px-4 py-2 rounded-lg text-xs"
                  style={{ backgroundColor: 'hsl(340, 74%, 42%)', color: 'white' }}
                >
                  Get Started Free
                </Link>
              </>
            )}
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

            {isAuthenticated ? (
              <>
                <div className="px-4 py-3" style={{ borderTop: '2px solid black', borderBottom: '2px solid black' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ backgroundColor: 'hsl(340, 74%, 42%)', color: 'white' }}
                    >
                      {getInitials()}
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'black' }}>
                        {getDisplayName()}
                      </p>
                      <p className="text-xs" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                        {userDetails?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setOpen(false);
                    router.push('/social-media');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors text-left"
                >
                  <LayoutDashboard size={18} style={{ color: 'hsl(340, 74%, 42%)' }} />
                  <span className="text-sm font-bold uppercase" style={{ color: 'rgba(0, 0, 0, 0.7)' }}>
                    Dashboard
                  </span>
                </button>

                <button
                  onClick={() => {
                    setOpen(false);
                    router.push('/social-media/settings');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors text-left"
                >
                  <Settings size={18} style={{ color: 'hsl(340, 74%, 42%)' }} />
                  <span className="text-sm font-bold uppercase" style={{ color: 'rgba(0, 0, 0, 0.7)' }}>
                    Settings
                  </span>
                </button>

                <button
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors text-left"
                >
                  <LogOut size={18} style={{ color: 'hsl(340, 74%, 42%)' }} />
                  <span className="text-sm font-bold uppercase" style={{ color: 'rgba(0, 0, 0, 0.7)' }}>
                    Logout
                  </span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block w-full text-left text-sm font-bold py-2 px-4 uppercase"
                  style={{ color: 'rgba(0, 0, 0, 0.7)' }}
                  onClick={() => setOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/login?tab=signup"
                  className="block w-full comic-btn px-5 py-2.5 rounded-lg text-sm text-center"
                  style={{ backgroundColor: 'hsl(340, 74%, 42%)', color: 'white' }}
                  onClick={() => setOpen(false)}
                >
                  Get Started Free
                </Link>
              </>
            )}
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
