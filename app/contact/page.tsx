"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, MessageCircle, Mail } from "lucide-react";

function handleSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
}

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-muted/50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Get in Touch
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Contact Us
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Have a question about bookings, tournaments, or our facilities? We&apos;d
            love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            {/* Form */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-xl">Send Us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="mb-1.5 block text-sm font-medium"
                      >
                        First Name
                      </label>
                      <Input id="firstName" placeholder="John" />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="mb-1.5 block text-sm font-medium"
                      >
                        Last Name
                      </label>
                      <Input id="lastName" placeholder="Doe" />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+234 800 000 0000"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="subject"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Subject
                    </label>
                    <Input id="subject" placeholder="Booking inquiry" />
                  </div>
                  <div>
                    <label
                      htmlFor="message"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Message
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how we can help..."
                      rows={5}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Address</h3>
                  <p className="mt-1 text-muted-foreground">
                    Amora Resort, First Mechanics Alakahia, Port Harcourt,
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
                    href="tel:+2341234567890"
                    className="mt-1 block text-muted-foreground transition-colors hover:text-primary"
                  >
                    +234 123 456 7890
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
                    href="https://wa.me/2341234567890"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-muted-foreground transition-colors hover:text-primary"
                  >
                    Chat with us on WhatsApp
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Email</h3>
                  <a
                    href="mailto:info@amoraresort.com"
                    className="mt-1 block text-muted-foreground transition-colors hover:text-primary"
                  >
                    info@amoraresort.com
                  </a>
                </div>
              </div>

              {/* Map */}
              <div className="overflow-hidden rounded-xl border border-border">
                <iframe
                  title="Amora Resort Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.7286792474964!2d3.4853553!3d6.4280556!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103bf52e0b4e3b11%3A0x7e5d0d0c0e0e0e0e!2sLekki%20Phase%201%2C%20PH!5e0!3m2!1sen!2sng!4v1700000000000!5m2!1sen!2sng"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-[250px] w-full lg:h-[300px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
