import { MapPin, Phone, MessageCircle } from "lucide-react";

export default function LocationContact() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Find Us
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Visit Amora Resort
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-border">
            <img
              alt="Amora Resort Location"
              src="/images/resort.jpg"
              className="h-[300px] w-full object-cover lg:h-[400px]"
            />
          </div>

          <div className="flex flex-col justify-center space-y-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Address</h3>
                <p className="mt-1 text-muted-foreground">
                  Amora Resort, First Mechanics Alakahia, PH
                  <br />
                  Rivers, Nigeria
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Phone</h3>
                <a
                  href="tel:+2349136548549"
                  className="mt-1 block text-muted-foreground transition-colors hover:text-primary"
                >
                  +234 913 654 8549
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">WhatsApp</h3>
                <a
                  href="https://wa.me/2349136548549"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-muted-foreground transition-colors hover:text-primary"
                >
                  Chat with us on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
