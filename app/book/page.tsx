"use client";

import BookingForm from "@/components/bookings/BookingForm";

export default function BookPage() {
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
