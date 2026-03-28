"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BookingForm from "@/components/bookings/BookingForm";
import { Loader2 } from "lucide-react";

export default function BookPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) {
          router.replace("/login?callbackUrl=/book");
        } else {
          setChecking(false);
        }
      })
      .catch(() => router.replace("/login?callbackUrl=/book"));
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="relative flex h-[40vh] items-center justify-center overflow-hidden bg-[#0a1a0f]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{
            backgroundImage: "url('/images/amora.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a0f] via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Book Your Game
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Reserve Your Pitch
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-gray-300">
            Choose your date, pick a time, and lock in your slot.
          </p>
        </div>
      </section>

      <section className="py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BookingForm />
        </div>
      </section>
    </>
  );
}
