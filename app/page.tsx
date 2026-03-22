"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Sparkles, ArrowRight, Zap, Check, Rocket, Target, TrendingUp, ChevronDown, User, Store, Building2, Megaphone } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

// Comic Hero Section
const HeroSection = () => {
  return (
    <section className="relative flex items-center halftone-bg overflow-hidden pt-20 pb-12" style={{ backgroundColor: 'hsl(340, 74%, 42%)', minHeight: '85vh' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10">
        {/* Comic headline */}
        <div className="text-center mb-8">
          <h1 className="comic-headline text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black mb-4" style={{ color: 'white' }}>
            YOUR SOCIAL MEDIA MANAGER{" "}
            <span className="highlight-strip">JUST CLOCKED IN.</span>
          </h1>
          <p className="text-base sm:text-lg font-semibold max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            Meet Jane — she creates posts, publishes on time, monitors trends, replies to customers, and writes you a performance report every week. She never takes leave. She never asks for a raise. She just... delivers.
          </p>
        </div>

        {/* Before/After Comic Panels */}
        <div className="grid md:grid-cols-2 gap-4 lg:gap-6 max-w-5xl mx-auto mb-8">
          {/* BEFORE Panel */}
          <div className="comic-panel relative" style={{ backgroundColor: 'white' }}>
            <div className="comic-caption absolute top-3 left-3 z-10">PANEL 1: BEFORE JANE</div>
            <div className="p-4 pt-12">
              {/* SVG Character - stressed */}
              <div className="flex justify-center mb-4">
                <svg width="120" height="140" viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="40" r="28" fill="#8D6E63" stroke="hsl(var(--foreground))" strokeWidth="3"/>
                  <circle cx="50" cy="36" r="4" fill="white" stroke="hsl(var(--foreground))" strokeWidth="2"/>
                  <circle cx="70" cy="36" r="4" fill="white" stroke="hsl(var(--foreground))" strokeWidth="2"/>
                  <circle cx="51" cy="37" r="2" fill="hsl(var(--foreground))"/>
                  <circle cx="71" cy="37" r="2" fill="hsl(var(--foreground))"/>
                  <path d="M48 52 Q60 46 72 52" stroke="hsl(var(--foreground))" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <path d="M86 28 Q88 22 90 28 Q88 32 86 28Z" fill="hsl(var(--uri-blue))" stroke="hsl(var(--foreground))" strokeWidth="1.5"/>
                  <path d="M92 36 Q94 32 96 36 Q94 39 92 36Z" fill="hsl(var(--uri-blue))" stroke="hsl(var(--foreground))" strokeWidth="1.5"/>
                  <rect x="38" y="68" width="44" height="50" rx="6" fill="hsl(var(--uri-purple))" stroke="hsl(var(--foreground))" strokeWidth="3"/>
                  <rect x="14" y="60" width="24" height="12" rx="6" fill="#8D6E63" stroke="hsl(var(--foreground))" strokeWidth="2.5"/>
                  <rect x="82" y="60" width="24" height="12" rx="6" fill="#8D6E63" stroke="hsl(var(--foreground))" strokeWidth="2.5"/>
                  <path d="M32 35 Q32 12 60 12 Q88 12 88 35" fill="#2D2D2D" stroke="hsl(var(--foreground))" strokeWidth="2.5"/>
                </svg>
              </div>
              <div className="space-y-3">
                <div className="speech-bubble text-sm text-foreground">
                  "My last post was 3 weeks ago..."
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  <span className="action-word text-xs !rotate-[-3deg]">BEHIND!</span>
                  <span className="action-word text-xs !rotate-[2deg]" style={{ background: 'hsl(var(--destructive))', color: 'white', borderColor: 'hsl(var(--foreground))' }}>0 ENGAGEMENT</span>
                </div>
              </div>
            </div>
          </div>

          {/* AFTER Panel */}
          <div className="comic-panel relative" style={{ backgroundColor: 'white' }}>
            <div className="comic-caption absolute top-3 left-3 z-10" style={{ background: 'hsl(var(--uri-green))', color: 'white', borderColor: 'hsl(var(--foreground))' }}>PANEL 2: AFTER JANE</div>
            <div className="p-4 pt-12">
              <div className="flex justify-center mb-4">
                <svg width="120" height="140" viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="40" r="28" fill="#8D6E63" stroke="hsl(var(--foreground))" strokeWidth="3"/>
                  <path d="M46 36 Q50 32 54 36" stroke="hsl(var(--foreground))" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <path d="M66 36 Q70 32 74 36" stroke="hsl(var(--foreground))" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <path d="M48 48 Q60 58 72 48" stroke="hsl(var(--foreground))" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <rect x="38" y="68" width="44" height="50" rx="6" fill="hsl(var(--uri-green))" stroke="hsl(var(--foreground))" strokeWidth="3"/>
                  <rect x="10" y="78" width="28" height="12" rx="6" fill="#8D6E63" stroke="hsl(var(--foreground))" strokeWidth="2.5"/>
                  <rect x="82" y="78" width="28" height="12" rx="6" fill="#8D6E63" stroke="hsl(var(--foreground))" strokeWidth="2.5"/>
                  <path d="M32 35 Q32 12 60 12 Q88 12 88 35" fill="#2D2D2D" stroke="hsl(var(--foreground))" strokeWidth="2.5"/>
                  <rect x="44" y="30" width="14" height="10" rx="3" fill="hsl(var(--foreground))"/>
                  <rect x="62" y="30" width="14" height="10" rx="3" fill="hsl(var(--foreground))"/>
                  <line x1="58" y1="35" x2="62" y2="35" stroke="hsl(var(--foreground))" strokeWidth="2"/>
                </svg>
              </div>
              <div className="space-y-3">
                <div className="speech-bubble text-sm text-foreground">
                  "Jane's got it handled."
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  <span className="action-word text-xs !rotate-[3deg]" style={{ background: 'hsl(var(--uri-green))', color: 'white', borderColor: 'hsl(var(--foreground))' }}>POSTED!</span>
                  <span className="action-word text-xs !rotate-[-2deg]" style={{ background: 'hsl(var(--primary))', color: 'white', borderColor: 'hsl(var(--foreground))' }}>SCHEDULED!</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button className="comic-btn px-6 py-3 rounded-lg text-sm" style={{ backgroundColor: 'black', color: 'white' }}>
            HIRE JANE — IT'S FREE
          </button>
          <button className="comic-btn px-6 py-3 rounded-lg text-sm" style={{ backgroundColor: 'white', color: 'hsl(340, 74%, 42%)' }}>
            SEE HER IN ACTION
          </button>
        </div>

        {/* Trust bar */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>TRUSTED BY 200+ BUSINESSES ACROSS NIGERIA · GHANA · KENYA · SOUTH AFRICA</p>
          <div className="flex justify-center -space-x-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black" style={{ backgroundColor: 'white', color: 'black', borderWidth: '3px', borderStyle: 'solid', borderColor: 'black' }}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black" style={{ backgroundColor: 'hsl(45, 100%, 51%)', color: 'black', borderWidth: '3px', borderStyle: 'solid', borderColor: 'black' }}>
              +194
            </div>
          </div>
        </div>
      </div>

      {/* Floating action words — kept select few */}
      <div className="absolute top-24 right-8 hidden lg:block action-word !text-xs animate-float-slow">TRENDING!</div>
      <div className="absolute bottom-32 left-12 hidden lg:block action-word !text-xs !rotate-[6deg] animate-float-medium" style={{ background: 'hsl(var(--uri-green))', color: 'white', borderColor: 'hsl(var(--foreground))' }}>APPROVED!</div>
      <div className="absolute top-1/2 right-16 hidden lg:block action-word !text-xs !rotate-[-8deg] animate-float-fast" style={{ background: 'hsl(var(--primary-foreground))', color: 'hsl(var(--primary))', borderColor: 'hsl(var(--foreground))' }}>SCHEDULED!</div>
    </section>
  );
};

// Social Posts Carousel Section
const SocialPostsCarousel = () => {
  const posts = [
    {
      platform: "Instagram",
      color: "text-pink-500",
      brandName: "Lagos Bites",
      handle: "@lagosbites",
      avatar: "LB",
      avatarBg: "bg-gradient-to-br from-pink-500 to-orange-400",
      caption: "New Jollof Rice bowl just dropped! Our weekend special is here and trust us — you don't want to miss this one. Order now on our app!",
      hashtags: "#LagosBites #JollofRice #NaijaFood #WeekendVibes",
      likes: "2,847",
      comments: "183",
      image: "/images/post-jollof.jpg",
    },
    {
      platform: "X.com",
      color: "text-foreground",
      brandName: "FreshFit Gym",
      handle: "@freshfit_ng",
      avatar: "FF",
      avatarBg: "bg-uri-green",
      caption: "Your Monday motivation just arrived. Consistency beats intensity. Show up today, even if it's just for 20 minutes.",
      hashtags: "#FitnessNigeria #MondayMotivation #GymLife",
      likes: "1,204",
      comments: "89",
      image: "/images/post-fitness.jpg",
    },
    {
      platform: "Facebook",
      color: "text-blue-600",
      brandName: "Aura Beauty Studio",
      handle: "Aura Beauty Studio",
      avatar: "AB",
      avatarBg: "bg-uri-purple",
      caption: "Glow up season is HERE! Book your bridal makeup trial this week and get 15% off your wedding day package.",
      hashtags: "#AuraBeauty #BridalMakeup #LagosWedding",
      likes: "956",
      comments: "124",
      image: "/images/post-beauty.jpg",
    },
    {
      platform: "LinkedIn",
      color: "text-blue-700",
      brandName: "Pulse Agency",
      handle: "Pulse Creative Agency",
      avatar: "PA",
      avatarBg: "bg-uri-blue",
      caption: "We helped a client go from 200 to 12,000 followers in 90 days — without a single paid ad. Here's what we learned:",
      hashtags: "#SocialMediaMarketing #AgencyLife",
      likes: "3,412",
      comments: "267",
      image: "/images/post-analytics.jpg",
    },
  ];

  const posts2 = [
    {
      platform: "TikTok",
      color: "text-foreground",
      brandName: "Chef Nkem",
      handle: "@chefnkem",
      avatar: "CN",
      avatarBg: "bg-gradient-to-br from-pink-500 to-cyan-400",
      caption: "POV: You tried making Egusi soup for the first time and your Nigerian friend is JUDGING.",
      hashtags: "#NigerianFood #EgusiSoup #CookingTikTok",
      likes: "48.2K",
      comments: "2,891",
      image: "/images/post-egusi.jpg",
    },
    {
      platform: "Pinterest",
      color: "text-red-600",
      brandName: "Accra Interiors",
      handle: "@accrainteriors",
      avatar: "AI",
      avatarBg: "bg-red-500",
      caption: "Minimalist Afro-modern living room inspo. Earthy tones, local textiles, clean lines.",
      hashtags: "#InteriorDesign #AfricanDecor #HomeInspo",
      likes: "5,621",
      comments: "312",
      image: "/images/post-interior.jpg",
    },
    {
      platform: "Instagram",
      color: "text-pink-500",
      brandName: "Sweet Tooth Lagos",
      handle: "@sweettooth_lag",
      avatar: "ST",
      avatarBg: "bg-gradient-to-br from-pink-300 to-purple-400",
      caption: "Ice cream weather is every weather in Lagos! Come grab our new Cookies & Cream cone.",
      hashtags: "#SweetToothLagos #IceCream #LagosEats",
      likes: "3,567",
      comments: "289",
      image: "/images/post-icecream.jpg",
    },
  ];

  const PostCard = ({ post }: { post: typeof posts[0] }) => (
    <div className="w-[360px] flex-shrink-0 comic-panel" style={{ backgroundColor: 'white' }}>
      <div className="flex items-center gap-3 p-5 pb-3">
        <div className={`w-12 h-12 rounded-full ${post.avatarBg} flex items-center justify-center text-white font-black text-sm`} style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: 'black' }}>
          {post.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black leading-tight truncate" style={{ color: 'black' }}>{post.brandName}</p>
          <p className="text-xs font-semibold truncate" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>{post.handle}</p>
        </div>
      </div>
      <div className="mx-5 mb-3 h-48 rounded-lg overflow-hidden" style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: 'black' }}>
        <Image
          src={post.image}
          alt={post.brandName}
          width={360}
          height={192}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="px-5 pb-5">
        <p className="text-sm font-semibold leading-relaxed mb-3" style={{ color: 'black', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {post.caption}
        </p>
        <p className="text-xs font-bold mb-4" style={{ color: 'hsl(207, 90%, 54%)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.hashtags}</p>
        <div className="flex items-center gap-6 text-sm font-bold pt-3" style={{ borderTop: '2px solid rgba(0, 0, 0, 0.08)', color: 'rgba(0, 0, 0, 0.6)' }}>
          <span>{post.likes} likes</span>
          <span>{post.comments} comments</span>
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-16 lg:py-20 overflow-hidden" style={{ backgroundColor: 'hsl(12, 100%, 98%)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="text-center">
          <div className="comic-caption inline-block mb-4">LIVE EXAMPLES</div>
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-3" style={{ color: 'black', transform: 'rotate(-1deg)' }}>
            Posts <span className="highlight-strip">Jane creates.</span> Every day.
          </h2>
          <p className="font-semibold max-w-xl mx-auto" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            Real content for real brands — across every platform that matters.
          </p>
        </div>
      </div>

      {/* First row - scrolls left */}
      <div className="relative mb-6">
        <div className="flex gap-6 animate-marquee-slow pl-6" style={{ width: 'max-content' }}>
          {[...posts, ...posts, ...posts].map((post, i) => (
            <PostCard key={`row1-${i}`} post={post} />
          ))}
        </div>
      </div>

      {/* Second row - scrolls right (reverse) */}
      <div className="relative">
        <div className="flex gap-6 animate-marquee-reverse pl-6" style={{ width: 'max-content' }}>
          {[...posts2, ...posts2, ...posts2].map((post, i) => (
            <PostCard key={`row2-${i}`} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
};

// Problem Section
const ProblemSection = () => {
  const panels = [
    {
      caption: "MEANWHILE, AT YOUR DESK...",
      letter: "C",
      letterBg: "bg-uri-blue",
      bubble: "You start your day with 100+ unread emails and zero social media posts ready.",
      title: "THE GHOST ACCOUNT",
      desc: "You set up Instagram, posted for 2 weeks, then life happened. Now your last post says 'Happy New Year 2024.'",
      rotation: "-rotate-1",
      color: "bg-uri-blue/10",
    },
    {
      caption: "THE SOCIAL MEDIA SITUATION...",
      letter: "S",
      letterBg: "bg-uri-purple",
      bubble: "Your social media hasn't been updated in weeks. Cobwebs are forming.",
      title: "THE COPY-PASTE CAPTIONS",
      desc: "You asked ChatGPT to write a post. It sounded like a robot wrote it. Because a robot wrote it. A robot that doesn't know your brand.",
      rotation: "rotate-1",
      color: "bg-uri-purple/10",
    },
    {
      caption: "THE CYCLE CONTINUES...",
      letter: "G",
      letterBg: "bg-uri-green",
      bubble: "Everything keeps getting pushed to 'next week'. Sound familiar?",
      title: "THE GUESSING GAME",
      desc: "You post when you remember. You use hashtags that feel right. You have no idea what's actually working.",
      rotation: "-rotate-[0.5deg]",
      color: "bg-uri-green/10",
    },
  ];

  return (
    <section className="py-16 lg:py-20 halftone-bg-light" style={{ backgroundColor: 'white' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color: 'black' }}>
            BE HONEST. <span className="highlight-strip">WHEN LAST DID YOU POST?</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto font-medium" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            Your competitor posted 3 times today. You posted... that one graphic from February.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {panels.map((p, i) => (
            <div key={i} className={`comic-panel ${p.rotation}`} style={{ backgroundColor: i === 0 ? '#E3F2FD' : i === 1 ? '#F3E5F5' : '#E8F5E9' }}>
              <div className="comic-caption m-3">{p.caption}</div>
              <div className="p-5 pt-2">
                <div className="flex justify-center mb-3">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white`} style={{ backgroundColor: i === 0 ? '#2196F3' : i === 1 ? '#9C27B0' : '#4CAF50', borderWidth: '3px', borderStyle: 'solid', borderColor: 'black' }}>
                    {p.letter}
                  </div>
                </div>
                <div className="speech-bubble text-sm mb-4" style={{ color: 'black' }}>
                  {p.bubble}
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-black mb-1 uppercase" style={{ color: 'black' }}>{p.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-xl sm:text-2xl font-black mb-2" style={{ color: 'black' }}>
            Sound familiar?
          </p>
          <p className="text-xl sm:text-2xl font-black" style={{ color: 'hsl(340, 74%, 42%)' }}>
            What if you could hire someone who actually shows up? Meet Jane.
          </p>
        </div>
      </div>
    </section>
  );
};

// Meet Jane Section (Employee of the Month)
const MeetJaneSection = () => {
  const stats = [
    { label: "CONTENT CREATION", fill: 8 },
    { label: "SPEED", fill: 10 },
    { label: "STAMINA (24/7)", fill: 10 },
    { label: "BRAND VOICE", fill: 8 },
    { label: "DAYS OFF", fill: 10, note: "0" },
  ];

  return (
    <section className="py-16 lg:py-20 relative overflow-hidden halftone-bg-dark" style={{ backgroundColor: 'hsl(330, 40%, 7%)', color: 'white' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color: 'white' }}>
            <span className="highlight-strip">EMPLOYEE OF THE MONTH.</span> EVERY MONTH.
          </h2>
        </div>

        <div className="relative flex justify-center">
          {/* Trading Card */}
          <div className="comic-panel max-w-sm w-full transition-transform duration-300" style={{ backgroundColor: 'white', color: 'black', transform: 'rotate(1deg)' }}>
            {/* Header */}
            <div className="text-center py-3" style={{ backgroundColor: 'hsl(340, 74%, 42%)', color: 'white', borderBottom: '3px solid black' }}>
              <p className="text-xs font-black uppercase tracking-widest">URI SOCIAL PRESENTS</p>
            </div>

            <div className="p-6">
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, hsl(340, 74%, 42%) 0%, hsl(340, 82%, 50%) 100%)',
                    border: '3px solid black',
                    color: 'white'
                  }}
                >
                  J
                </div>
              </div>

              <div className="text-center mb-5">
                <h3 className="text-3xl font-black uppercase" style={{ color: 'black' }}>JANE</h3>
                <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>AI SOCIAL MEDIA MANAGER</p>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: 'hsl(122, 39%, 49%)' }} />
                  <span className="text-xs font-black uppercase" style={{ color: 'hsl(122, 39%, 49%)' }}>ACTIVE NOW</span>
                </div>
              </div>

              <hr className="comic-divider mb-4" />

              {/* Stats bars */}
              <div className="space-y-3">
                {stats.map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-black uppercase tracking-wider" style={{ color: 'black' }}>{s.label}</span>
                      {s.note && <span className="text-xs font-black" style={{ color: 'hsl(340, 74%, 42%)' }}>{s.note}</span>}
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-3 flex-1 rounded-sm"
                          style={{
                            border: '1px solid rgba(0, 0, 0, 0.2)',
                            backgroundColor: i < s.fill ? 'hsl(340, 74%, 42%)' : 'rgba(0, 0, 0, 0.08)'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-center mt-5 italic font-medium" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
                References available upon request. (Spoiler: she's never been fired.)
              </p>
            </div>
          </div>

          {/* Floating stats — text only, no emojis */}
          <div className="absolute top-8 -left-4 sm:left-4 hidden sm:block">
            <div className="speech-bubble text-xs font-bold !p-3" style={{ backgroundColor: 'white', color: 'black' }}>
              0 sick days taken
            </div>
          </div>
          <div className="absolute top-1/3 -right-4 sm:right-4 hidden sm:block">
            <div className="speech-bubble speech-bubble-right text-xs font-bold !p-3" style={{ backgroundColor: 'white', color: 'black' }}>
              Infinite posts drafted
            </div>
          </div>
          <div className="absolute bottom-12 -left-4 sm:left-8 hidden sm:block">
            <div className="speech-bubble text-xs font-bold !p-3" style={{ backgroundColor: 'white', color: 'black' }}>
              Zero salary negotiations
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Onboarding Section (Get Her Up to Speed)
const OnboardingSection = () => {
  const steps = [
    {
      num: 1,
      title: "Teach her your vibe",
      desc: "Upload your logo. Pick your colors. Take a 60-second brand personality quiz (are you \"Witty & Playful\" or \"Polished & Professional\"?). Jane learns your entire visual identity and voice before her first day is over.",
      illustration: (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="20" width="50" height="40" rx="4" fill="hsl(207, 90%, 54%)" stroke="black" strokeWidth="3"/>
          <rect x="22" y="28" width="16" height="16" rx="2" fill="hsl(340, 74%, 42%)" stroke="black" strokeWidth="2"/>
          <rect x="42" y="28" width="16" height="6" rx="1" fill="hsl(45, 100%, 51%)" stroke="black" strokeWidth="1.5"/>
          <rect x="42" y="38" width="16" height="6" rx="1" fill="hsl(122, 39%, 49%)" stroke="black" strokeWidth="1.5"/>
          <path d="M35 10 L40 18 L30 18 Z" fill="hsl(45, 100%, 51%)" stroke="black" strokeWidth="2"/>
        </svg>
      ),
      tags: ["Witty & Playful", "Polished & Professional", "Bold & Confident", "Warm & Friendly"],
    },
    {
      num: 2,
      title: "Give her the playbook",
      desc: "Set your content pillars (Behind the Scenes, Product Highlights, Tips & Education). Choose your platforms. Tell her what to never talk about. Define your posting rhythm. Done.",
      illustration: (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="15" width="50" height="55" rx="4" fill="white" stroke="black" strokeWidth="3"/>
          <rect x="24" y="24" width="12" height="8" rx="2" fill="hsl(122, 39%, 49%)" stroke="black" strokeWidth="1.5"/>
          <line x1="40" y1="28" x2="56" y2="28" stroke="black" strokeWidth="2"/>
          <rect x="24" y="38" width="12" height="8" rx="2" fill="hsl(282, 67%, 38%)" stroke="black" strokeWidth="1.5"/>
          <line x1="40" y1="42" x2="56" y2="42" stroke="black" strokeWidth="2"/>
          <rect x="24" y="52" width="12" height="8" rx="2" fill="hsl(45, 100%, 51%)" stroke="black" strokeWidth="1.5"/>
          <line x1="40" y1="56" x2="56" y2="56" stroke="black" strokeWidth="2"/>
          <path d="M28 26 L31 29 L36 24" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      tags: ["Behind the Scenes", "Product Highlights", "Tips & Education", "Promos"],
    },
    {
      num: 3,
      title: "Let her cook",
      desc: "Jane drafts posts. You approve from WhatsApp, email, or the dashboard. She publishes at the perfect time. You go back to running your business.",
      illustration: (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="10" width="40" height="60" rx="6" fill="hsl(122, 39%, 49%)" stroke="black" strokeWidth="3"/>
          <rect x="26" y="18" width="28" height="36" rx="2" fill="white" stroke="black" strokeWidth="1.5"/>
          <text x="40" y="40" textAnchor="middle" fill="black" fontSize="10" fontWeight="900">✓</text>
          <circle cx="40" cy="62" r="4" fill="white" stroke="black" strokeWidth="1.5"/>
        </svg>
      ),
      tags: [],
      whatsapp: true,
    },
  ];

  return (
    <section id="how-she-works" className="py-16 lg:py-20 halftone-bg-light" style={{ backgroundColor: 'hsl(12, 100%, 98%)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color: 'black', transform: 'rotate(-1deg)' }}>
            GET HER UP TO SPEED IN <span className="highlight-strip">5 MINUTES.</span>
          </h2>
          <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>SHE'S A FAST LEARNER.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Dashed connector lines */}
          <div className="hidden md:block absolute top-24 left-[33%] w-[10%]" style={{ borderTop: '4px dashed black', transform: 'rotate(2deg)' }} />
          <div className="hidden md:block absolute top-24 right-[23%] w-[10%]" style={{ borderTop: '4px dashed black', transform: 'rotate(-2deg)' }} />

          {steps.map((step) => (
            <div key={step.num} className="comic-panel transition-shadow duration-150 hover:shadow-lg" style={{ backgroundColor: 'white' }}>
              <div className="p-6">
                {/* Step number */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black"
                    style={{
                      backgroundColor: 'hsl(340, 74%, 42%)',
                      border: '3px solid black',
                      color: 'white'
                    }}
                  >
                    {step.num}
                  </div>
                </div>

                {/* Illustration */}
                <div className="flex justify-center mb-4">
                  {step.illustration}
                </div>

                <h3 className="text-xl font-black uppercase mb-2" style={{ color: 'black' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>{step.desc}</p>

                {/* Tags */}
                {step.tags.length > 0 && (
                  <div className="mt-4 flex gap-2 flex-wrap">
                    {step.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-bold px-3 py-1.5 rounded-full"
                        style={{
                          backgroundColor: step.num === 1 ? 'rgba(203, 42, 124, 0.1)' : 'rgba(136, 58, 152, 0.1)',
                          color: step.num === 1 ? 'hsl(340, 74%, 42%)' : 'hsl(282, 67%, 38%)',
                          border: `1px solid ${step.num === 1 ? 'rgba(203, 42, 124, 0.2)' : 'rgba(136, 58, 152, 0.2)'}`
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* WhatsApp mockup */}
                {step.whatsapp && (
                  <div className="mt-4 comic-panel" style={{ backgroundColor: 'rgba(76, 175, 80, 0.05)', borderColor: 'hsl(122, 39%, 49%)', boxShadow: '3px 3px 0px hsl(122, 39%, 49%)' }}>
                    <div className="p-3">
                      <p className="text-xs font-black mb-1 uppercase" style={{ color: 'hsl(122, 39%, 49%)' }}>WHATSAPP · JUST NOW</p>
                      <p className="text-sm font-bold" style={{ color: 'black' }}>
                        Jane: "Your Instagram post is ready! Reply <strong>1</strong> to approve, <strong>2</strong> to revise."
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="comic-btn px-8 py-4 rounded-lg text-base" style={{ backgroundColor: 'hsl(340, 74%, 42%)', color: 'white' }}>
            SOUNDS GOOD. HIRE HER →
          </button>
        </div>
      </div>
    </section>
  );
};

// Daily Timeline Section (A Day in Jane's Life)
const DailyTimeline = () => {
  const timeline = [
    { time: "6:00 AM", text: "Checks what's trending in your industry. Spots a viral topic before your competitors do.", color: "rgba(255, 193, 7, 0.1)", actionWord: null },
    { time: "8:00 AM", text: "Drafts 3 posts tailored to your brand voice. Queues them in your approval inbox.", color: "rgba(33, 150, 243, 0.1)", actionWord: null },
    { time: "9:15 AM", text: "You approve 2 posts from WhatsApp while drinking your morning coffee. Takes 30 seconds.", color: "rgba(76, 175, 80, 0.1)", actionWord: "APPROVED!" },
    { time: "10:00 AM", text: "Publishes your first post at the optimal time for your audience. Hashtags selected. Caption perfect.", color: "rgba(203, 42, 124, 0.05)", actionWord: "POSTED!" },
    { time: "1:00 PM", text: "Flags a DM from a potential wholesale buyer. Suggests a reply in your brand voice.", color: "rgba(156, 39, 176, 0.1)", actionWord: null },
    { time: "4:00 PM", text: "Notices your carousel post is getting 3x more saves than usual. Sends you a quick heads-up.", color: "rgba(33, 150, 243, 0.1)", actionWord: "3x ENGAGEMENT" },
    { time: "10:00 PM", text: "Still working. Scheduling tomorrow's content. Monitoring overnight engagement. No overtime pay needed.", color: "rgba(156, 39, 176, 0.1)", actionWord: null },
    { time: "Every Friday", text: "Writes you a performance memo: what worked, what didn't, and what to do next week.", color: "rgba(76, 175, 80, 0.1)", actionWord: null },
  ];

  return (
    <section className="py-16 lg:py-20 halftone-bg" style={{ backgroundColor: 'white' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color: 'black', transform: 'rotate(-1deg)' }}>
            A DAY IN <span className="highlight-strip">JANE'S LIFE</span>
          </h2>
          <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>(SHE'S ALWAYS ON)</p>
        </div>

        <div className="relative">
          {/* Vertical timeline line */}
          <div
            className="absolute left-6 md:left-1/2 top-0 bottom-0 w-1 rounded-full"
            style={{ backgroundColor: 'black', transform: 'rotate(0.3deg) translateX(-0.5px)' }}
          />

          <div className="space-y-6">
            {timeline.map((item, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div key={i} className="relative">
                  <div className="md:grid md:grid-cols-2 md:gap-8 pl-14 md:pl-0">
                    <div className={isLeft ? "md:text-right md:pr-8" : "md:col-start-2 md:pl-8"}>
                      <div className="comic-panel relative" style={{ backgroundColor: item.color, boxShadow: '4px 4px 0px black' }}>
                        <div className="comic-caption m-2" style={{ fontSize: '11px' }}>{item.time}</div>
                        <div className="p-4 pt-2">
                          <p className="text-sm leading-relaxed" style={{ color: 'black' }}>
                            {item.text}
                          </p>
                          {item.actionWord && (
                            <div className="mt-3 text-center">
                              <span className="action-word" style={{ fontSize: '11px' }}>{item.actionWord}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Timeline dot */}
                  <div
                    className="absolute left-4 md:left-1/2 top-5 w-4 h-4 rounded-full"
                    style={{ backgroundColor: 'hsl(340, 74%, 42%)', border: '3px solid black', transform: 'translateX(-2px) md:translateX(-8px)' }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

// Workspace Section (Watch Your AI Team Work)
const WorkspaceSection = () => {
  return (
    <section className="py-16 lg:py-20 halftone-bg-light" style={{ backgroundColor: 'hsl(12, 100%, 98%)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color: 'black', transform: 'rotate(-1deg)' }}>
            <span className="highlight-strip">WATCH YOUR AI TEAM WORK</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto font-medium" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            No menus to learn. No settings to configure. Just talk to Jane and she gets it done.
          </p>
        </div>

        <div className="relative flex justify-center">
          <div className="w-full max-w-2xl comic-panel transition-transform duration-300" style={{ backgroundColor: 'white', transform: 'rotate(1deg)' }}>
            {/* Browser header */}
            <div className="px-5 py-2 flex items-center gap-2" style={{ backgroundColor: 'black', color: 'white', borderBottom: '3px solid black' }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444', border: '1px solid rgba(255, 255, 255, 0.2)' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(45, 100%, 51%)', border: '1px solid rgba(255, 255, 255, 0.2)' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(122, 39%, 49%)', border: '1px solid rgba(255, 255, 255, 0.2)' }} />
              <span className="text-xs font-black ml-3 uppercase tracking-wider">URI SOCIAL — JANE'S WORKSPACE</span>
            </div>

            {/* Chat interface */}
            <div className="p-6 space-y-4">
              {/* Jane's message */}
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, hsl(340, 74%, 42%) 0%, hsl(340, 82%, 50%) 100%)',
                    border: '2px solid black',
                    color: 'white'
                  }}
                >
                  J
                </div>
                <div className="speech-bubble flex-1 text-sm" style={{ border: '2px solid black', padding: '12px', color: 'black' }}>
                  I've prepared your content calendar for next week! 3 Instagram reels, 5 feed posts, and 2 LinkedIn articles.
                </div>
              </div>

              {/* Your message */}
              <div className="flex items-start gap-3 flex-row-reverse">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)', border: '2px solid black', color: 'black' }}
                >
                  You
                </div>
                <div className="speech-bubble speech-bubble-right flex-1 text-sm" style={{ border: '2px solid black', padding: '12px', color: 'black' }}>
                  Yes! And make the Tuesday post more casual, we're announcing a sale
                </div>
              </div>

              {/* Jane's response */}
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, hsl(340, 74%, 42%) 0%, hsl(340, 82%, 50%) 100%)',
                    border: '2px solid black',
                    color: 'white'
                  }}
                >
                  J
                </div>
                <div className="speech-bubble flex-1 text-sm" style={{ border: '2px solid black', padding: '12px', color: 'black' }}>
                  Done! Updated with sale energy. Here's a preview:
                </div>
              </div>

              {/* Post preview */}
              <div className="ml-11 comic-panel" style={{ boxShadow: '3px 3px 0px black', backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
                <div className="h-28 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
                  <span className="text-2xl font-black" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>SALE</span>
                </div>
                <div className="p-3">
                  <p className="text-xs font-black mb-1 uppercase" style={{ color: 'black' }}>INSTAGRAM · TUESDAY 10:00 AM</p>
                  <p className="text-xs" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>"SALE ALERT — Your favourites just got friendlier on your wallet. Up to 40% off..."</p>
                </div>
                <div className="flex" style={{ borderTop: '2px solid black' }}>
                  <button className="flex-1 py-2 text-xs font-black uppercase" style={{ color: 'hsl(122, 39%, 49%)', borderRight: '2px solid black' }}>
                    APPROVE
                  </button>
                  <button className="flex-1 py-2 text-xs font-black uppercase" style={{ color: 'hsl(207, 90%, 54%)', borderRight: '2px solid black' }}>
                    REVISE
                  </button>
                  <button className="flex-1 py-2 text-xs font-black uppercase" style={{ color: '#EF4444' }}>
                    REJECT
                  </button>
                </div>
              </div>
            </div>

            {/* Input field */}
            <div className="px-6 pb-5">
              <div className="flex items-center rounded-lg px-4 py-3 gap-3" style={{ border: '3px solid black' }}>
                <span className="text-sm flex-1 font-bold" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>Give Jane a directive...</span>
                <span className="font-black" style={{ color: 'hsl(340, 74%, 42%)' }}>↑</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-base font-bold italic" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            Yes, you can literally just tell her "make me a post about our new product" and she'll do it.
          </p>
        </div>
      </div>
    </section>
  );
};

// Comparison Section (Let's Be Real)
const ComparisonSection = () => {
  const columns = [
    {
      title: "DIY",
      subtitle: "Doing it yourself",
      highlighted: false,
      color: "rgba(239, 68, 68, 0.05)",
      borderColor: "#EF4444",
      rows: [
        { label: "Hours spent/week", value: "10-15", bad: true },
        { label: "Cost", value: "Your sanity", bad: true },
        { label: "Brand consistency", value: "Depends on your mood", bad: true },
        { label: "Trending awareness", value: "You find out 3 days late", bad: true },
      ],
      verdict: "You have a business to run.",
      badge: null,
    },
    {
      title: "AGENCY",
      subtitle: "Hiring a freelancer/agency",
      highlighted: false,
      color: "rgba(255, 193, 7, 0.05)",
      borderColor: "hsl(45, 100%, 51%)",
      rows: [
        { label: "Hours saved", value: "Most of them", bad: false },
        { label: "Cost", value: "₦150K-₦500K/month", bad: true },
        { label: "Brand consistency", value: "Takes 3 months", bad: true },
        { label: "Trending awareness", value: "12 other clients", bad: true },
      ],
      verdict: "Expensive. Not their only priority.",
      badge: null,
    },
    {
      title: "JANE",
      subtitle: "Hiring Jane",
      highlighted: true,
      color: "rgba(203, 42, 124, 0.05)",
      borderColor: "hsl(340, 74%, 42%)",
      rows: [
        { label: "Hours saved", value: "All of them", bad: false },
        { label: "Cost", value: "From ₦15,000/mo", bad: false },
        { label: "Brand consistency", value: "Learned in 5 mins", bad: false },
        { label: "Trending awareness", value: "Real-time, 24/7", bad: false },
      ],
      verdict: "No brainer, honestly.",
      badge: "WINNER!",
    },
  ];

  return (
    <section className="py-16 lg:py-20 halftone-bg" style={{ backgroundColor: 'white' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color: 'black' }}>
            LET'S BE REAL. <span className="highlight-strip">WHAT ARE YOUR OTHER OPTIONS?</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {columns.map((col, i) => (
            <div
              key={i}
              className={`comic-panel relative ${col.highlighted ? "transform scale-105 md:scale-110 z-10" : ""}`}
              style={{ backgroundColor: col.color, borderColor: col.borderColor }}
            >
              {col.badge && (
                <div
                  className="absolute -top-4 -right-2 action-word z-20"
                  style={{
                    fontSize: '14px',
                    transform: 'rotate(8deg)',
                    backgroundColor: 'hsl(122, 39%, 49%)',
                    color: 'white'
                  }}
                >
                  {col.badge}
                </div>
              )}

              <div className="p-6">
                <h3 className="text-2xl font-black text-center mb-1 uppercase" style={{ color: 'black' }}>
                  {col.title}
                </h3>
                <p className="text-xs text-center mb-5 font-bold uppercase tracking-wider" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
                  {col.subtitle}
                </p>

                <hr className="comic-divider mb-4" />

                <div className="space-y-3 mb-5">
                  {col.rows.map((row, j) => (
                    <div key={j}>
                      <p className="text-xs uppercase tracking-wider font-black" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
                        {row.label}
                      </p>
                      <p className="text-sm font-black" style={{ color: row.bad ? '#EF4444' : 'hsl(122, 39%, 49%)' }}>
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-4" style={{ borderTop: '3px solid black' }}>
                  <p
                    className="text-sm font-black italic"
                    style={{ color: col.highlighted ? 'hsl(340, 74%, 42%)' : 'rgba(0, 0, 0, 0.5)' }}
                  >
                    {col.verdict}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Personas Section (Who Jane Works For)
const PersonasSection = () => {
  const personas = [
    {
      icon: User,
      title: "Individuals",
      description: "Trying to build an audience, grow your personal brand, but can't keep up with posting consistently?",
      color: "hsl(340, 74%, 42%)",
      bg: "rgba(203, 42, 124, 0.1)",
    },
    {
      icon: Store,
      title: "Small & Mid Businesses",
      description: "You're the CEO, marketer, and customer service — all at once?",
      color: "hsl(282, 67%, 38%)",
      bg: "rgba(156, 39, 176, 0.1)",
    },
    {
      icon: Building2,
      title: "Large Businesses",
      description: "Need scale and consistency across multiple channels?",
      color: "hsl(207, 90%, 54%)",
      bg: "rgba(33, 150, 243, 0.1)",
    },
    {
      icon: Megaphone,
      title: "Agencies",
      description: "Managing 10+ client accounts is pure chaos?",
      color: "hsl(122, 39%, 49%)",
      bg: "rgba(76, 175, 80, 0.1)",
    },
  ];

  return (
    <section className="py-16 lg:py-20 halftone-bg-light" style={{ backgroundColor: 'hsl(12, 100%, 98%)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color: 'black' }}>
            WHO <span className="highlight-strip">JANE WORKS FOR</span>
          </h2>
          <p className="font-bold text-lg max-w-2xl mx-auto" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            Whether you're a one-person show or a full agency, Jane's got your back.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {personas.map((p, i) => {
            const Icon = p.icon;
            return (
              <Link
                key={i}
                href="#"
                className="comic-panel block p-6 hover:translate-y-[-2px] transition-transform duration-200"
                style={{ backgroundColor: 'white' }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-lg shrink-0"
                    style={{ backgroundColor: p.bg, border: '2px solid black' }}
                  >
                    <Icon style={{ color: p.color }} className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black uppercase mb-1" style={{ color: 'black' }}>
                      {p.title}
                    </h3>
                    <p className="text-sm font-bold mb-3" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                      {p.description}
                    </p>
                    <span className="text-sm font-black uppercase tracking-wide" style={{ color: 'hsl(340, 74%, 42%)' }}>
                      SEE HOW →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// Built For Africa Section
const BuiltForAfricaSection = () => {
  const features = [
    { letter: "M", title: "Multilingual queen", desc: "Posts in English, Pidgin, Yoruba, Hausa, Igbo, French, and more. Jane code-switches better than you.", color: "hsl(282, 67%, 38%)" },
    { letter: "W", title: "WhatsApp everything", desc: "Approve posts, get alerts, review performance — all from WhatsApp. Because that's how we move.", color: "hsl(122, 39%, 49%)" },
    { letter: "N", title: "Naira pricing, no wahala", desc: "No dollar conversions. No surprise charges. Pricing that makes sense for African businesses.", color: "hsl(45, 100%, 51%)" },
    { letter: "P", title: "Mobile-first, always", desc: "Designed for the way you actually work. Phone in one hand, business in the other.", color: "hsl(207, 90%, 54%)" },
    { letter: "T", title: "Knows your audience", desc: "Optimized for WAT, EAT, CAT timezones. Posts when your people are scrolling.", color: "hsl(282, 67%, 38%)" },
    { letter: "L", title: "Local trends, local vibes", desc: "Jane monitors Nigerian Twitter, Lagos Instagram, Nairobi TikTok. She gets the culture.", color: "hsl(340, 74%, 42%)" },
  ];

  const countries = [
    { name: "Nigeria", flag: "🇳🇬", x: "42%", y: "52%" },
    { name: "Ghana", flag: "🇬🇭", x: "35%", y: "50%" },
    { name: "Kenya", flag: "🇰🇪", x: "62%", y: "52%" },
    { name: "South Africa", flag: "🇿🇦", x: "52%", y: "78%" },
    { name: "Egypt", flag: "🇪🇬", x: "55%", y: "25%" },
  ];

  return (
    <section className="py-16 lg:py-20 relative overflow-hidden halftone-bg-dark" style={{ backgroundColor: 'hsl(330, 40%, 7%)', color: 'white' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color: 'white', transform: 'rotate(-1deg)' }}>
            <span className="highlight-strip">SHE SPEAKS YOUR LANGUAGE.</span> LITERALLY.
          </h2>
        </div>

        {/* Africa map with pins */}
        <div className="flex justify-center mb-12">
          <div className="relative w-64 h-72">
            <svg width="256" height="288" viewBox="0 0 256 288" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M128 20 C100 20 80 30 70 50 C60 70 55 80 50 100 C45 120 40 140 45 160 C50 180 55 200 60 220 C65 240 75 260 90 270 C105 280 125 282 140 275 C155 268 170 250 180 230 C190 210 195 190 198 170 C201 150 200 130 195 110 C190 90 180 70 170 50 C160 30 145 20 128 20Z"
                fill="hsl(340, 74%, 42%)" stroke="black" strokeWidth="3" opacity="0.8"/>
            </svg>
            {/* Country pins */}
            {countries.map((c) => (
              <div key={c.name} className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-float-slow" style={{ left: c.x, top: c.y }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-lg" style={{ backgroundColor: 'white', border: '2px solid black' }}>
                  {c.flag}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="comic-panel transition-colors duration-150 hover:bg-white/10" style={{ borderColor: 'rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <div className="p-5">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black mb-4"
                  style={{ backgroundColor: f.color, border: '3px solid black', color: 'white' }}
                >
                  {f.letter}
                </div>
                <h3 className="text-lg font-black mb-2 uppercase" style={{ color: 'white' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Testimonials Section
const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "I used to spend my Sundays batch-creating content. Now Jane handles everything and my Sundays are mine again. Omo, this thing is real.",
      name: "Bola A.",
      title: "Founder, Lagos Bites",
      industry: "Food delivery",
      initial: "B",
      color: "hsl(282, 67%, 38%)",
    },
    {
      quote: "Our posting went from once a week to daily. Engagement tripled in the first month. Jane understands our brand better than our last intern did.",
      name: "Chike N.",
      title: "CEO, FreshFit Gym",
      industry: "Fitness",
      initial: "C",
      color: "hsl(207, 90%, 54%)",
    },
    {
      quote: "The WhatsApp approval is genius. I approve posts between meetings. No logging in, no dashboards, no stress.",
      name: "Amina T.",
      title: "Owner, Aura Beauty Studio",
      industry: "Beauty",
      initial: "A",
      color: "hsl(122, 39%, 49%)",
    },
    {
      quote: "We manage 4 brands. Jane handles all of them without mixing up the voices. That alone is worth the subscription.",
      name: "David O.",
      title: "Creative Director, Pulse Agency",
      industry: "Agency",
      initial: "D",
      color: "hsl(45, 100%, 51%)",
    },
  ];

  return (
    <section className="py-16 lg:py-20 halftone-bg overflow-hidden" style={{ backgroundColor: 'white' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color: 'black', transform: 'rotate(-1deg)' }}>
            DON'T TAKE OUR WORD FOR IT. <span className="highlight-strip">TAKE THEIRS.</span>
          </h2>
          <p className="text-xs italic font-bold" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>* Placeholder testimonials — to be replaced with real ones</p>
        </div>

        {/* Marquee testimonials */}
        <div className="relative">
          <div className="flex gap-6 animate-marquee" style={{ width: 'max-content' }}>
            {[...testimonials, ...testimonials].map((t, i) => (
              <div key={i} className="w-80 flex-shrink-0">
                <div className="speech-bubble text-sm mb-8" style={{ border: '2px solid black', color: 'black' }}>
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <span key={j} className="text-lg" style={{ color: 'hsl(45, 100%, 51%)' }}>★</span>
                    ))}
                  </div>
                  "{t.quote}"
                </div>
                <div className="flex items-center gap-3 pl-6">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg"
                    style={{ backgroundColor: t.color, border: '3px solid black', color: 'white' }}
                  >
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-sm font-black" style={{ color: 'black' }}>{t.name}</p>
                    <p className="text-xs font-bold" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>{t.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Final CTA Section
const FinalCTASection = () => {
  return (
    <section className="py-16 lg:py-20 relative overflow-hidden halftone-bg" style={{ backgroundColor: 'hsl(340, 74%, 42%)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div>
          {/* Relaxed character */}
          <div className="flex justify-center mb-8">
            <svg width="140" height="160" viewBox="0 0 140 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="20" y="110" width="100" height="8" rx="2" fill="hsl(45, 100%, 51%)" stroke="black" strokeWidth="2.5"/>
              <rect x="30" y="118" width="8" height="30" fill="hsl(45, 100%, 51%)" stroke="black" strokeWidth="2"/>
              <rect x="102" y="118" width="8" height="30" fill="hsl(45, 100%, 51%)" stroke="black" strokeWidth="2"/>
              <rect x="50" y="92" width="40" height="18" rx="3" fill="hsl(207, 90%, 54%)" stroke="black" strokeWidth="2.5"/>
              <rect x="55" y="96" width="30" height="10" rx="1" fill="white"/>
              <text x="64" y="104" fontSize="6" fontWeight="900" fill="hsl(340, 74%, 42%)">JANE</text>
              <circle cx="70" cy="55" r="22" fill="#8D6E63" stroke="black" strokeWidth="3"/>
              <rect x="56" y="49" width="12" height="8" rx="3" fill="black"/>
              <rect x="72" y="49" width="12" height="8" rx="3" fill="black"/>
              <line x1="68" y1="53" x2="72" y2="53" stroke="black" strokeWidth="2"/>
              <path d="M60 63 Q70 73 80 63" stroke="black" strokeWidth="2.5" fill="white" strokeLinecap="round"/>
              <rect x="52" y="77" width="36" height="35" rx="6" fill="hsl(122, 39%, 49%)" stroke="black" strokeWidth="3"/>
              <path d="M52 85 L35 70 L40 60" stroke="#8D6E63" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M88 85 L105 70 L100 60" stroke="#8D6E63" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M48 48 Q48 33 70 33 Q92 33 92 48" fill="#2D2D2D" stroke="black" strokeWidth="2.5"/>
              <circle cx="125" cy="20" r="12" fill="hsl(45, 100%, 51%)" stroke="black" strokeWidth="2"/>
            </svg>
          </div>

          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color: 'white' }}>
            IF YOU ARE READING THIS, YOU ARE ALREADY AHEAD.
          </h2>
          <p className="text-lg mb-10 max-w-xl mx-auto font-bold" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Your competitors are still doing it manually. You won't be.
          </p>

          <button className="comic-btn px-10 py-4 rounded-lg text-lg" style={{ backgroundColor: 'black', color: 'white' }}>
            HIRE JANE →
          </button>

          <p className="text-sm mt-6 font-bold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            JOIN 200+ AFRICAN BUSINESSES ALREADY WORKING WITH JANE
          </p>
        </div>
      </div>

      {/* Floating action words */}
      <div className="absolute top-16 left-8 hidden lg:block action-word animate-float-slow" style={{ fontSize: '11px', backgroundColor: 'hsl(122, 39%, 49%)', color: 'white', transform: 'rotate(-8deg)' }}>POSTED!</div>
      <div className="absolute bottom-20 right-12 hidden lg:block action-word animate-float-medium" style={{ fontSize: '11px', transform: 'rotate(6deg)' }}>SCHEDULED!</div>
      <div className="absolute top-1/3 right-8 hidden lg:block action-word animate-float-fast" style={{ fontSize: '11px', backgroundColor: 'hsl(282, 67%, 38%)', color: 'white', transform: 'rotate(-4deg)' }}>APPROVED!</div>
    </section>
  );
};

// How It Works Section
const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      icon: Rocket,
      title: "Connect Your Accounts",
      description: "Link your social media accounts in seconds. Jane syncs with all major platforms instantly.",
      tag: "30 seconds",
    },
    {
      number: "02",
      icon: Target,
      title: "Set Your Goals",
      description: "Tell Jane your brand voice, target audience, and posting schedule. She learns and adapts.",
      tag: "5 minutes",
    },
    {
      number: "03",
      icon: TrendingUp,
      title: "Watch Jane Work",
      description: "Jane creates engaging content, schedules posts, monitors engagement, and sends you weekly reports.",
      tag: "24/7",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 lg:py-32 bg-gradient-to-b from-background to-primary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Simple Process</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Get started in <span className="text-gradient-primary">3 easy steps</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            No technical skills needed. Jane handles everything from content creation to analytics.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative group"
            >
              <div className="bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 h-full">
                {/* Tag */}
                <div className="absolute -top-4 right-8">
                  <span className="gradient-primary text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                    {step.tag}
                  </span>
                </div>

                {/* Icon */}
                <div className="mb-6 relative">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -left-2 text-7xl font-bold text-primary/5 group-hover:text-primary/10 transition-colors duration-300">
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>

              {/* Connector Line (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-6 lg:-right-12 w-12 lg:w-24 h-0.5 bg-gradient-to-r from-primary/50 to-primary/10" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Pricing Section
const PricingSection = () => {
  const plans = [
    {
      name: "Intern",
      price: "Free",
      period: "",
      desc: "Just getting started",
      features: ["3 social accounts", "30 AI posts/month", "Dashboard approval only", "Basic analytics"],
      cta: "Start Free",
      popular: false,
    },
    {
      name: "Full-Time",
      price: "₦15,000",
      period: "/mo",
      desc: "The real deal",
      features: [
        "Unlimited accounts",
        "Unlimited AI posts",
        "WhatsApp + Email + Dashboard approval",
        "Social inbox & customer messages",
        "Trend monitoring & competitor watching",
        "Weekly performance memos",
        "Team access (up to 5 members)",
      ],
      cta: "Hire Jane →",
      popular: true,
    },
    {
      name: "Executive",
      price: "₦50,000",
      period: "/mo",
      desc: "Enterprise energy",
      features: [
        "Everything in Full-Time",
        "Multi-brand management",
        "API access & custom integrations",
        "Priority support",
        "Dedicated onboarding session",
        "Advanced analytics & exports",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-16 lg:py-20 halftone-bg-light" style={{ backgroundColor: 'hsl(12, 100%, 98%)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color: 'black' }}>
            WHAT'S THE DAMAGE? <span className="text-2xl sm:text-3xl" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>(SPOILER: LESS THAN YOU THINK)</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`comic-panel relative ${
                plan.popular
                  ? "transform scale-105 z-10"
                  : ""
              }`}
              style={{
                backgroundColor: plan.popular ? 'rgba(203, 42, 124, 0.05)' : 'white',
                borderColor: plan.popular ? 'hsl(340, 74%, 42%)' : 'black'
              }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 action-word" style={{ fontSize: '11px', transform: 'translateX(-50%) rotate(-3deg)' }}>
                  MOST POPULAR
                </div>
              )}
              {plan.name === "Executive" && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 action-word" style={{ fontSize: '11px', transform: 'translateX(-50%) rotate(2deg)', backgroundColor: 'black', color: 'white' }}>
                  FOR TEAMS
                </div>
              )}

              <div className="p-6 pt-8">
                <h3 className="text-2xl font-black uppercase mb-1" style={{ color: 'black' }}>{plan.name}</h3>
                <p className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>{plan.desc}</p>

                <div className="mb-6">
                  <span className="text-4xl font-black" style={{ color: 'black' }}>{plan.price}</span>
                  <span className="text-sm font-bold" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>{plan.period}</span>
                </div>

                <hr className="comic-divider mb-5" />

                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm flex items-start gap-2 font-medium" style={{ color: 'black' }}>
                      <span className="font-black mt-0.5" style={{ color: 'hsl(122, 39%, 49%)' }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-lg font-black uppercase tracking-wide text-sm comic-btn ${
                    plan.popular
                      ? ""
                      : ""
                  }`}
                  style={{
                    backgroundColor: plan.popular ? 'hsl(340, 74%, 42%)' : 'white',
                    color: plan.popular ? 'white' : 'black'
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <div className="speech-bubble inline-block text-sm max-w-xl mx-auto" style={{ color: 'black' }}>
            For context: a social media agency charges ₦150,000-₦500,000/month. A freelancer costs ₦80,000+. Jane starts at free. <strong>Free free.</strong> Not "free trial" free. Actually free.
          </div>
        </div>
      </div>
    </section>
  );
};

// FAQ Section
const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How does Jane create content?",
      answer: "Jane uses advanced AI to analyze your brand voice, audience preferences, and trending topics. She generates engaging, on-brand content tailored to each platform's best practices.",
    },
    {
      question: "Can I review posts before they go live?",
      answer: "Absolutely! You can set Jane to auto-publish or require your approval for each post. You have full control over your content strategy.",
    },
    {
      question: "Which social media platforms does Jane support?",
      answer: "Jane supports all major platforms including Facebook, Instagram, Twitter/X, LinkedIn, TikTok, Pinterest, and YouTube. We're constantly adding new platforms.",
    },
    {
      question: "How does the free trial work?",
      answer: "Your 14-day free trial includes full access to all features in your chosen plan. No credit card required. Cancel anytime during the trial with no charges.",
    },
    {
      question: "Can I change plans later?",
      answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges.",
    },
    {
      question: "What kind of analytics does Jane provide?",
      answer: "Jane tracks engagement metrics, audience growth, best posting times, content performance, and ROI. You'll receive detailed reports tailored to your plan level.",
    },
  ];

  return (
    <section id="faq" className="py-24 lg:py-32 bg-gradient-to-b from-background to-primary/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">FAQ</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Questions? <span className="text-gradient-primary">We've got answers</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about Jane and how she works
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 text-left group"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold pr-8 group-hover:text-primary transition-colors">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-primary shrink-0 transition-transform duration-300 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <motion.div
                  initial={false}
                  animate={{
                    height: openIndex === index ? "auto" : 0,
                    opacity: openIndex === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="text-muted-foreground mt-4 leading-relaxed">{faq.answer}</p>
                </motion.div>
              </button>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-4">Still have questions?</p>
          <button className="gradient-primary text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-105">
            Contact Support
          </button>
        </motion.div>
      </div>
    </section>
  );
};

// Main Landing Page
export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <SocialPostsCarousel />
      <ProblemSection />
      <MeetJaneSection />
      <OnboardingSection />
      <DailyTimeline />
      <WorkspaceSection />
      <ComparisonSection />
      <PersonasSection />
      <BuiltForAfricaSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTASection />
    </main>
  );
}
