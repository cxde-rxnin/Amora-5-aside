import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import dbConnect from "@/lib/mongodb";
import SiteConfig from "@/models/SiteConfig";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Transparent pricing for Amora Resort's 5-aside football pitch. Off-peak and peak hour rates with no hidden fees.",
};

async function getSiteConfig() {
  await dbConnect();
  let config = await SiteConfig.findOne().lean();
  if (!config) {
    config = await SiteConfig.create({});
  }
  return JSON.parse(JSON.stringify(config));
}

export default async function PricingPage() {
  const config = await getSiteConfig();

  const pricingPlans = [
    {
      title: "Off-Peak",
      price: config.pitchOffPeakPrice.toLocaleString(),
      period: "per hour",
      timeSlot: "Monday – Friday, 8:00 AM – 4:00 PM",
      description: "Perfect for daytime games when the pitch is quieter.",
      features: [
        "Full pitch access",
        "Changing rooms & showers",
        "Free parking",
        "Wi-Fi access",
        "Water dispenser",
      ],
    },
    {
      title: "Peak Hours",
      price: config.pitchPeakPrice.toLocaleString(),
      period: "per hour",
      timeSlot: "Mon–Fri 4 PM–10 PM & All Weekends",
      description: "Prime time with full floodlights for evening play.",
      features: [
        "Full pitch access",
        "Professional floodlights",
        "Changing rooms & showers",
        "Free parking",
        "Wi-Fi access",
        "Water dispenser",
      ],
      highlighted: true,
    },
    {
      title: "Weekend Full Day",
      price: (config.pitchWeekendPrice * 8 * 0.8).toLocaleString(), // Example discount for full day
      period: "8 hours",
      timeSlot: "Saturday or Sunday, 8:00 AM – 4:00 PM",
      description: "Book the entire pitch for a full day — ideal for events.",
      features: [
        "8 hours of pitch access",
        "Professional floodlights",
        "Changing rooms & showers",
        "Free parking",
        "Wi-Fi access",
        "Dedicated staff support",
        "Water & refreshments area",
      ],
    },
  ];

  const faqs = [
    {
      question: "What's included in the price?",
      answer:
        "All bookings include full pitch access, changing rooms, showers, parking, and Wi-Fi. Peak hour bookings also include professional floodlights.",
    },
    {
      question: "Is there a deposit required?",
      answer:
        "No deposits — full payment is made at the time of booking to secure your slot.",
    },
    {
      question: "Can I cancel or reschedule?",
      answer:
        "Cancellations made 24+ hours before your slot receive a full refund. Rescheduling is free up to 12 hours before your booking.",
    },
    {
      question: "Are there discounts for regular bookings?",
      answer:
        "Yes! Teams that book weekly recurring slots receive a 10% discount. Contact us for details.",
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative flex h-[50vh] items-center justify-center overflow-hidden bg-[#0a1a0f]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{
            backgroundImage: "url('/images/pricing.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a0f] via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Pricing
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            No hidden fees. No surprises. Just pick your time and play.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.title}
                className={
                  plan.highlighted
                    ? "relative border-primary shadow-xl"
                    : "border-border/50"
                }
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge>Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {plan.timeSlot}
                  </p>
                  <div className="mt-4">
                    <span className="text-5xl font-extrabold">{plan.price}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      NGN {plan.period}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-8 w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/book">Book This Slot</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tournament Entry */}
      <section className="bg-muted/50 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Tournament Entry Fees
            </h2>
            <p className="mt-4 text-muted-foreground">
              Tournament pricing varies depending on the event. Entry fees
              typically start from{" "}
              <span className="font-semibold text-foreground">
                NGN {config.tournamentEntryFee.toLocaleString()} per team
              </span>
              . Each tournament page will display specific pricing and prize pool
              details.
            </p>
            <Button asChild className="mt-8">
              <Link href="/tournaments">View Upcoming Tournaments</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-8 space-y-6">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
