import { getAceternityProStatus } from '@little-bootstrapper/ui-web';
import { Hero } from '@/components/landing/hero';
import { FeaturesGrid } from '@/components/landing/features-grid';
import { WorkflowsTimeline } from '@/components/landing/workflows-timeline';
import { AgentsSection, BenderSection, FinalCta } from '@/components/landing/sections';

export default function HomePage() {
  const proStatus = getAceternityProStatus();

  return (
    <div className="relative">
      <Hero proEnabled={proStatus.enabled} />
      <FeaturesGrid />
      <WorkflowsTimeline />
      <AgentsSection />
      <BenderSection />
      <FinalCta />
    </div>
  );
}
