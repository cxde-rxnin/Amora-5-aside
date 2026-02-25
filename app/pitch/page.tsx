import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Zap,
  Sun,
  Shield,
  DoorOpen,
  Ruler,
  Droplets,
  ParkingCircle,
  Wifi,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Our Pitch",
  description:
    "Explore the features of Amora Resort's premium 5-aside football pitch — FIFA-standard turf, professional floodlights, and world-class facilities.",
};
import { Carousel, Card as CarouselCard } from "@/components/ui/apple-cards-carousel";
const galleryImages = [
  {
    src: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=800&auto=format&fit=crop",
    alt: "Amora pitch at night with floodlights",
  },
  {
    src: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=800&auto=format&fit=crop",
    alt: "Close-up of premium artificial turf",
  },
  {
    src: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=800&auto=format&fit=crop",
    alt: "Football on the pitch",
  },
  {
    src: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop",
    alt: "Players in action",
  },
];

const galleryCards = galleryImages.map((image, index) => (
  <CarouselCard
    key={index}
    card={{
      src: image.src,
      title: image.alt,
      category: "Amora Pitch",
      content: (
        <div className="flex flex-col gap-4">
          <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
            {image.alt}
          </p>
          <img
            src={image.src}
            alt={image.alt}
            className="w-full h-auto rounded-xl object-contain"
          />
        </div>
      ),
    }}
    index={index}
  />
));

const features = [
  { icon: Zap, title: "Premium Artificial Turf", description: "FIFA-quality synthetic grass for optimal ball control and player safety." },
  { icon: Sun, title: "LED Floodlights", description: "Professional-grade lighting for clear visibility during evening and night games." },
  { icon: Shield, title: "Security & CCTV", description: "24/7 security with CCTV coverage across the entire facility." },
  { icon: DoorOpen, title: "Changing Rooms", description: "Clean, spacious changing rooms with lockers and hot showers." },
  { icon: Ruler, title: "Regulation Size", description: "Standard 5-aside dimensions (25m x 42m) with proper markings." },
  { icon: Droplets, title: "Drainage System", description: "Advanced drainage ensures playable conditions even after heavy rain." },
  { icon: ParkingCircle, title: "Free Parking", description: "Ample secured parking space for all players and spectators." },
  { icon: Wifi, title: "Free Wi-Fi", description: "Stay connected with complimentary high-speed wireless internet." },
];

const rules = [
  "Maximum 5 players per team on the pitch at any time.",
  "Shin guards are mandatory for all players.",
  "No slide tackles allowed.",
  "Goalkeeper cannot cross the halfway line.",
  "Kick-ins instead of throw-ins.",
  "No offside rule.",
  "5-minute halves for regular bookings, 10-minute halves for tournaments.",
  "Rolling substitutions permitted.",
];

export default function PitchPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex h-[50vh] items-center justify-center overflow-hidden bg-[#0a1a0f]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=2071&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a0f] via-transparent to-transparent" />
        <div className="relative z-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Our Facility
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            The Pitch
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-gray-300">
            A world-class 5-aside football experience built for players who
            demand nothing but the best.
          </p>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Pitch Gallery
          </h2>
          <div className="mt-8">
            <Carousel items={galleryCards} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/50 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Pitch Features
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/50">
                <CardContent className="pt-6">
                  <feature.icon className="h-8 w-8 text-primary" />
                  <h3 className="mt-3 font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Rules */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Pitch Rules
            </h2>
            <p className="mt-2 text-muted-foreground">
              Please follow these rules to ensure a safe and enjoyable experience
              for everyone.
            </p>
            <ul className="mt-8 space-y-3">
              {rules.map((rule, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-primary-foreground">
            Ready to Play?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Book your slot today and experience the best 5-aside pitch in PH.
          </p>
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="mt-8"
          >
            <Link href="/book">Book Now</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
