import dbConnect from "@/lib/mongodb";
import SiteConfig from "@/models/SiteConfig";
import Hero from "@/components/landing/hero";
import WhyAmora from "@/components/landing/why-amora";
import PricingPreview from "@/components/landing/pricing-preview";
import HowItWorks from "@/components/landing/how-it-works";
import TournamentsPreview from "@/components/landing/tournaments-preview";
import LocationContact from "@/components/landing/location-contact";

async function getSiteConfig() {
  await dbConnect();
  let config = await SiteConfig.findOne().lean();
  if (!config) {
    config = await SiteConfig.create({});
  }
  return JSON.parse(JSON.stringify(config));
}

export default async function Home() {
  const config = await getSiteConfig();

  return (
    <>
      <Hero
        title={config.heroTitle}
        subtitle={config.heroSubtitle}
      />
      <WhyAmora />
      <PricingPreview
        offPeakPrice={config.pitchOffPeakPrice}
        peakPrice={config.pitchPeakPrice}
      />
      <HowItWorks />
      <TournamentsPreview />
      <LocationContact />
    </>
  );
}
