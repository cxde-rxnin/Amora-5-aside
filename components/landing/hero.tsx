import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-[#0a1a0f]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=2071&auto=format&fit=crop')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a0f] via-[#0a1a0f]/60 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p className="animate-fade-in-up text-sm font-semibold uppercase tracking-widest text-emerald-400">
          Amora Resort &mdash; Port Harcourt, Nigeria
        </p>
        <h1 className="animate-fade-in-up-delay-1 mt-4 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-7xl">
          Book Port Harcourt&apos; Premier
          <br />
          <span className="text-emerald-400">5-Aside Football Pitch</span>
        </h1>
        <p className="animate-fade-in-up-delay-2 mx-auto mt-6 max-w-2xl text-lg text-gray-300 sm:text-xl">
          Premium artificial turf, professional floodlights, and top-tier
          facilities. The ultimate 5-aside experience awaits you.
        </p>
        <div className="animate-fade-in-up-delay-3 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild className="w-full sm:w-auto">
            <Link href="/book">Book Now</Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white sm:w-auto"
          >
            <Link href="/tournaments">View Tournaments</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
