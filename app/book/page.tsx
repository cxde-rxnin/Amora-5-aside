"use client";

import BookingForm from "@/components/bookings/BookingForm";

export default function BookPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-muted/50 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Book Your Game
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Reserve Your Pitch
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
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
