'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/src/providers/AuthProvider';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === '/';
  const { isAuthenticated, userDetails, logoutUser } = useAuth();

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
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <Image
                src="/images/urilogo-nobg.png"
                alt="URI Social"
                width={44}
                height={44}
                className="h-11 w-auto transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <span
              className="text-lg font-light tracking-wide lowercase italic transition-all duration-300 group-hover:tracking-wider"
              style={{
                color: '#CD1B78',
                fontFamily: 'Georgia, "Times New Roman", serif',
                letterSpacing: '0.5px',
              }}
            >
              social
            </span>
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
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ backgroundColor: '#CD1B78', color: 'white' }}
                    >
                      {getInitials()}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{getDisplayName()}</span>
                  </button>

                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl overflow-hidden bg-white border border-gray-200"
                      >
                        <div className="p-4 border-b border-gray-100">
                          <p className="font-semibold text-sm text-gray-900">{getDisplayName()}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{userDetails?.email}</p>
                        </div>

                        <div className="py-1">
                          <button
                            onClick={() => {
                              setProfileMenuOpen(false);
                              router.push('/workspace');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                          >
                            <LayoutDashboard size={18} className="text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Dashboard</span>
                          </button>

                          <button
                            onClick={() => {
                              setProfileMenuOpen(false);
                              router.push('/workspace?tab=settings');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-[18px] h-[18px] text-gray-600"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                              />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Billing & Credits</span>
                          </button>

                          <button
                            onClick={() => {
                              setProfileMenuOpen(false);
                              router.push('/workspace?tab=settings');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                          >
                            <Settings size={18} className="text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Settings</span>
                          </button>
                        </div>

                        <div className="border-t border-gray-100 py-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left"
                          >
                            <LogOut size={18} className="text-red-600" />
                            <span className="text-sm font-medium text-red-600">Logout</span>
                          </button>
                        </div>
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
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 space-y-1 border-t border-gray-200 bg-white">
                {/* Navigation Links */}
                <Link
                  href="/how-she-works"
                  className="block px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#CD1B78] transition-colors rounded-lg mx-2"
                  onClick={() => setOpen(false)}
                >
                  How It Works
                </Link>
                <Link
                  href="/pricing"
                  className="block px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#CD1B78] transition-colors rounded-lg mx-2"
                  onClick={() => setOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  href="/about"
                  className="block px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#CD1B78] transition-colors rounded-lg mx-2"
                  onClick={() => setOpen(false)}
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="block px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#CD1B78] transition-colors rounded-lg mx-2"
                  onClick={() => setOpen(false)}
                >
                  Contact
                </Link>

                {isAuthenticated ? (
                  <>
                    {/* User Profile Section */}
                    <div className="mt-3 pt-3 border-t border-gray-100 mx-2">
                      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl mb-2">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm"
                          style={{ backgroundColor: '#CD1B78', color: 'white' }}
                        >
                          {getInitials()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{getDisplayName()}</p>
                          <p className="text-xs text-gray-500 truncate">{userDetails?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Account Actions */}
                    <button
                      onClick={() => {
                        setOpen(false);
                        router.push('/workspace');
                      }}
                      className="w-full flex items-center gap-3 px-6 py-2.5 hover:bg-gray-50 transition-colors text-left rounded-lg mx-2"
                    >
                      <LayoutDashboard size={18} className="text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Dashboard</span>
                    </button>

                    <button
                      onClick={() => {
                        setOpen(false);
                        router.push('/workspace?tab=settings');
                      }}
                      className="w-full flex items-center gap-3 px-6 py-2.5 hover:bg-gray-50 transition-colors text-left rounded-lg mx-2"
                    >
                      <Settings size={18} className="text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Settings</span>
                    </button>

                    <div className="pt-2 mt-2 border-t border-gray-100 mx-2">
                      <button
                        onClick={() => {
                          setOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-6 py-2.5 hover:bg-red-50 transition-colors text-left rounded-lg"
                      >
                        <LogOut size={18} className="text-red-600" />
                        <span className="text-sm font-medium text-red-600">Logout</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Auth Buttons for Non-authenticated Users */}
                    <div className="pt-3 mt-3 border-t border-gray-100 space-y-2 px-2">
                      <Link
                        href="/login"
                        className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/login?tab=signup"
                        className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                        style={{ backgroundColor: '#CD1B78' }}
                        onClick={() => setOpen(false)}
                      >
                        Get Started Free
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
