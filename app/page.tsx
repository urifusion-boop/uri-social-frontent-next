'use client';

import BuiltForAfricaSection from '@/components/landing/features/BuiltForAfricaSection';
import ComparisonSection from '@/components/landing/features/ComparisonSection';
import DailyTimeline from '@/components/landing/features/DailyTimeline';
import FAQSection from '@/components/landing/features/FAQSection';
import FinalCTASection from '@/components/landing/features/FinalCTASection';
import MeetJaneSection from '@/components/landing/features/MeetJaneSection';
import OnboardingSection from '@/components/landing/features/OnboardingSection';
import ProblemSection from '@/components/landing/features/ProblemSection';
import SocialPostsCarousel from '@/components/landing/features/SocialPostsCarousel';
import TestimonialsSection from '@/components/landing/features/TestimonialsSection';
import WorkspaceSection from '@/components/landing/features/WorkspaceSection';
import HeroSection from '@/components/landing/hero/HeroSection';

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
      <BuiltForAfricaSection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTASection />
    </main>
  );
}
