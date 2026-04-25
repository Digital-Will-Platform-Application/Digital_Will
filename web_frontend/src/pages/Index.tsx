import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import LandingStatsSection from "@/components/home/LandingStatsSection";
import LandingHowSection from "@/components/home/LandingHowSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import LandingSecuritySection from "@/components/home/LandingSecuritySection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CTASection from "@/components/home/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-0">
        <HeroSection />
        <LandingStatsSection />
        <LandingHowSection />
        <FeaturesSection />
        <LandingSecuritySection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
