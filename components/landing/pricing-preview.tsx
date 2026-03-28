import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PricingPreviewProps {
  offPeakPrice?: number;
  peakPrice?: number;
}

export default function PricingPreview({ offPeakPrice, peakPrice }: PricingPreviewProps) {
  const pricingPlans = [
    {
      title: "Off-Peak Hours",
      badge: "Best Value",
      price: (offPeakPrice || 15000).toLocaleString(),
      period: "per hour",
      timeSlot: "Mon–Fri, 8AM–4PM",
      features: [
        "Full pitch access",
        "Changing rooms included",
        "Free parking",
      ],
    },
    {
      title: "Peak Hours",
      badge: "Most Popular",
      price: (peakPrice || 25000).toLocaleString(),
      period: "per hour",
      timeSlot: "Evenings & Weekends",
      features: [
        "Full pitch access",
        "Floodlights included",
        "Changing rooms included",
        "Free parking",
      ],
      highlighted: true,
    },
  ];

  return (
    <section className="bg-muted/50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Pricing
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Choose the time slot that works best for your team. No hidden fees.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.title}
              className={
                plan.highlighted
                  ? "border-primary shadow-lg"
                  : "border-border/50"
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.title}</CardTitle>
                  <Badge
                    variant={plan.highlighted ? "default" : "secondary"}
                  >
                    {plan.badge}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{plan.timeSlot}</p>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="ml-1 text-sm text-muted-foreground">
                    NGN {plan.period}
                  </span>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button variant="outline" asChild>
            <Link href="/pricing">View Full Pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
