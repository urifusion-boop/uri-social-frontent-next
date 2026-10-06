'use client';

import BeforeAfterSection from '@/components/landing/features/BeforeAfterSection';
import BuiltForAfricaSection from '@/components/landing/features/BuiltForAfricaSection';
import CaseStudySection from '@/components/landing/features/CaseStudySection';
import ComparisonSection from '@/components/landing/features/ComparisonSection';
import DailyTimeline from '@/components/landing/features/DailyTimeline';
import EvidenceSection from '@/components/landing/features/EvidenceSection';
import FAQSection from '@/components/landing/features/FAQSection';
import FinalCTASection from '@/components/landing/features/FinalCTASection';
import FocusSection from '@/components/landing/features/FocusSection';
import GrowthEngineSection from '@/components/landing/features/GrowthEngineSection';
import MeetJaneSection from '@/components/landing/features/MeetJaneSection';
import OnboardingSection from '@/components/landing/features/OnboardingSection';
import OutcomeCardsSection from '@/components/landing/features/OutcomeCardsSection';
import OutcomePromptSection from '@/components/landing/features/OutcomePromptSection';
import ProblemSection from '@/components/landing/features/ProblemSection';
import SocialPostsCarousel from '@/components/landing/features/SocialPostsCarousel';
import TestimonialsSection from '@/components/landing/features/TestimonialsSection';
import UseCasesSection from '@/components/landing/features/UseCasesSection';
import WorkspaceSection from '@/components/landing/features/WorkspaceSection';
import HeroSection from '@/components/landing/hero/HeroSection';

// Main Landing Page
export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <OutcomePromptSection />
      <SocialPostsCarousel />
      <ProblemSection />
      <FocusSection />
      <OutcomeCardsSection />
      <MeetJaneSection />
      <GrowthEngineSection />
      <OnboardingSection />
      <DailyTimeline />
      <WorkspaceSection />
      <ComparisonSection />
      <BuiltForAfricaSection />
      <UseCasesSection />
      <BeforeAfterSection />
      <EvidenceSection />
      <CaseStudySection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTASection />
    </main>
  );
}
