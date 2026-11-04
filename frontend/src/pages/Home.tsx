import React, { lazy } from 'react';
import { Hero } from '../components/Hero';
import { ImpactStats } from '../components/ImpactStats';
import { DeferredSection } from '../components/DeferredSection';
import type { SupportTab } from '../components/SupportModal';

const BuyOneGiveOneSection = lazy(() =>
  import('../components/BuyOneGiveOneSection').then((module) => ({
    default: module.BuyOneGiveOneSection,
  }))
);
const ProjectGallery = lazy(() =>
  import('../components/ProjectGallery').then((module) => ({
    default: module.ProjectGallery,
  }))
);
const HomeFeaturedProject = lazy(() =>
  import('../components/HomeFeaturedProject').then((module) => ({
    default: module.HomeFeaturedProject,
  }))
);
const HomeConviction = lazy(() =>
  import('../components/HomeConviction').then((module) => ({
    default: module.HomeConviction,
  }))
);
const MissionProgramsShowcase = lazy(() =>
  import('../components/MissionProgramsShowcase').then((module) => ({
    default: module.MissionProgramsShowcase,
  }))
);
const CommunityDrivesShowcase = lazy(() =>
  import('../components/CommunityDrivesShowcase').then((module) => ({
    default: module.CommunityDrivesShowcase,
  }))
);
const CTASection = lazy(() =>
  import('../components/CTASection').then((module) => ({
    default: module.CTASection,
  }))
);

interface HomeProps {
  onOpenSupport: (tab?: SupportTab, projectSlug?: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onOpenSupport }) => {
  return (
    <div className="bg-[#080808] text-white">
      {/* SECTION 1 — HERO (DARK #080808 + VIBRANT GREEN & LIME ACCENTS) */}
      <Hero onOpenSupport={onOpenSupport} />

      {/* SECTION 2 — IMPACT (#122023 SLATE + COLOR-BLOCKED CARDS) */}
      <ImpactStats />

      <DeferredSection placeholderHeight={900}>
        <BuyOneGiveOneSection />
      </DeferredSection>

      <DeferredSection placeholderHeight={1100}>
        <ProjectGallery />
      </DeferredSection>

      <DeferredSection placeholderHeight={900}>
        <HomeFeaturedProject />
      </DeferredSection>

      <DeferredSection placeholderHeight={700}>
        <HomeConviction />
      </DeferredSection>

      <DeferredSection placeholderHeight={950}>
        <MissionProgramsShowcase onOpenSupport={onOpenSupport} />
      </DeferredSection>

      <DeferredSection placeholderHeight={900}>
        <CommunityDrivesShowcase />
      </DeferredSection>

      <DeferredSection placeholderHeight={700}>
        <CTASection onOpenSupport={onOpenSupport} />
      </DeferredSection>
    </div>
  );
};
