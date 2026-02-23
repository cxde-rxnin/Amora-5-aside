import { CalendarDays, CreditCard, Trophy } from "lucide-react";

const steps = [
  {
    icon: CalendarDays,
    step: "01",
    title: "Choose Your Date",
    description:
      "Pick an available date and time slot that suits your team. Browse our real-time availability calendar.",
  },
  {
    icon: CreditCard,
    step: "02",
    title: "Pay Online",
    description:
      "Secure your booking instantly with our easy online payment system. No deposits—pay the full amount upfront.",
  },
  {
    icon: Trophy,
    step: "03",
    title: "Show Up & Play",
    description:
      "Arrive at Amora Resort, gear up in the changing rooms, and enjoy a premium football experience.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            How It Works
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Book Your Pitch in 3 Simple Steps
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((item, index) => (
            <div key={item.step} className="relative text-center">
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-12 hidden h-px w-full bg-border md:block" />
              )}
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <item.icon className="h-10 w-10 text-primary" />
                <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {item.step}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
