import { Card, CardContent } from "@/components/ui/card";
import { Zap, Sun, Shield, DoorOpen } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Premium Turf",
    description:
      "FIFA-standard artificial turf that delivers consistent ball control and player comfort throughout every match.",
  },
  {
    icon: Sun,
    title: "Floodlights",
    description:
      "Professional-grade LED floodlights enabling night games with even, shadow-free illumination across the entire pitch.",
  },
  {
    icon: Shield,
    title: "Secure Environment",
    description:
      "Gated compound with CCTV monitoring and on-site security, so you can focus purely on your game.",
  },
  {
    icon: DoorOpen,
    title: "Changing Rooms",
    description:
      "Clean, well-maintained changing rooms with lockers and shower facilities for pre and post-match convenience.",
  },
];

export default function WhyAmora() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Why Choose Us
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need for the Perfect Game
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Amora Resort provides a world-class 5-aside football experience with
            top-tier facilities designed for players who demand the best.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
            >
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
