import Hero from "@/components/landing/hero";
import WhyAmora from "@/components/landing/why-amora";
import PricingPreview from "@/components/landing/pricing-preview";
import HowItWorks from "@/components/landing/how-it-works";
import TournamentsPreview from "@/components/landing/tournaments-preview";
import LocationContact from "@/components/landing/location-contact";

export default function Home() {
  return (
    <>
      <Hero />
      <WhyAmora />
      <PricingPreview />
      <HowItWorks />
      <TournamentsPreview />
      <LocationContact />
    </>
  );
}
