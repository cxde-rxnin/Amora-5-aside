import BookingForm from "@/components/bookings/BookingForm";

export default function DashboardBookPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Book a Pitch</h1>
        <p className="text-muted-foreground mt-1">
          Choose your date, pick a time, and lock in your slot.
        </p>
      </div>
      <BookingForm />
    </div>
  );
}
