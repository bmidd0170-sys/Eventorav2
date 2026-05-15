import { Navigation } from "@/components/landing/navigation"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { TutorialSection } from "@/components/landing/tutorial-section"
import { PersonasSection } from "@/components/landing/personas-section"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <TutorialSection />
      <PersonasSection />
      <CTASection />
      <Footer />
    </main>
  )
}
