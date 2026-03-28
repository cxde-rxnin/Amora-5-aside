import nodemailer from "nodemailer";
import {
  welcomeTemplate,
  bookingInitiatedTemplate,
  bookingConfirmedTemplate,
  tournamentJoinedTemplate,
  teamJoinTemplate
} from "./email-templates";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send a welcome email to a new user.
 */
export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const html = welcomeTemplate(name);
  try {
    await transporter.sendMail({
      from: `"Amora Resort" <${process.env.SMTP_USER || "noreply@amoraresort.com"}>`,
      to,
      subject: "Welcome to Amora Resort!",
      html,
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
}

interface BookingConfirmationData {
  to: string;
  customerName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  txRef: string;
  amount: number;
}

/**
 * Send booking confirmation email.
 */
export async function sendBookingConfirmation(
  data: BookingConfirmationData
): Promise<void> {
  const {
    to,
    customerName,
    bookingDate,
    startTime,
    endTime,
    duration,
    txRef,
    amount,
  } = data;

  const formattedDate = new Date(bookingDate).toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = bookingConfirmedTemplate({
    customerName,
    date: formattedDate,
    time: `${startTime} – ${endTime}`,
    duration: duration === 60 ? "1 Hour" : "2 Hours",
    amount,
    txRef,
  });

  try {
    await transporter.sendMail({
      from: `"Amora Resort" <${process.env.SMTP_USER || "noreply@amoraresort.com"}>`,
      to,
      subject: `Booking Confirmed – ${formattedDate} at ${startTime}`,
      html,
    });
  } catch (error) {
    console.error("Failed to send booking confirmation email:", error);
  }
}

/**
 * Send "Payment Required" email after initiating a booking.
 */
export async function sendBookingInitiatedEmail(data: {
  to: string;
  customerName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  amount: number;
  paymentLink: string;
}): Promise<void> {
  const formattedDate = new Date(data.date).toLocaleDateString("en-NG", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const html = bookingInitiatedTemplate({
    customerName: data.customerName,
    date: formattedDate,
    time: `${data.startTime} – ${data.endTime}`,
    duration: data.duration === 60 ? "1 Hour" : "2 Hours",
    amount: data.amount,
    paymentLink: data.paymentLink,
  });

  try {
    await transporter.sendMail({
      from: `"Amora Resort" <${process.env.SMTP_USER || "noreply@amoraresort.com"}>`,
      to: data.to,
      subject: "Complete Your Booking – Amora Resort",
      html,
    });
  } catch (error) {
    console.error("Failed to send booking initiated email:", error);
  }
}

/**
 * Send tournament registration email.
 */
export async function sendTournamentRegistrationEmail(data: {
  to: string;
  captainName: string;
  teamName: string;
  tournamentName: string;
  entryFee: number;
  isPaid: boolean;
  paymentLink?: string;
}): Promise<void> {
  const html = tournamentJoinedTemplate(data);
  try {
    await transporter.sendMail({
      from: `"Amora Tournaments" <${process.env.SMTP_USER || "noreply@amoraresort.com"}>`,
      to: data.to,
      subject: data.isPaid ? `Tournament Registration Confirmed: ${data.tournamentName}` : `Payment Pending: ${data.tournamentName} Registration`,
      html,
    });
  } catch (error) {
    console.error("Failed to send tournament registration email:", error);
  }
}

/**
 * Send team join notification to captain.
 */
export async function sendTeamJoinEmail(data: {
  to: string;
  playerName: string;
  teamName: string;
  captainName: string;
}): Promise<void> {
  const html = teamJoinTemplate(data);
  try {
    await transporter.sendMail({
      from: `"Amora Teams" <${process.env.SMTP_USER || "noreply@amoraresort.com"}>`,
      to: data.to,
      subject: `New Player Joined: ${data.teamName}`,
      html,
    });
  } catch (error) {
    console.error("Failed to send team join email:", error);
  }
}

interface ContactEmailData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export async function sendContactEmail(data: ContactEmailData): Promise<void> {
  const { firstName, lastName, email, phone, subject, message } = data;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #0d4a2e; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Amora Resort</h1>
        <p style="color: #4ade80; margin: 8px 0 0; font-size: 14px;">New Contact Message</p>
      </div>

      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #111827; margin: 0 0 16px;">Contact Form Submission</h2>
        
        <p><strong>From:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        
        <div style="margin-top: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
          <p style="margin: 0; white-space: pre-wrap;">${message}</p>
        </div>
      </div>

      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Amora Resort. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Amora Contact" <${process.env.SMTP_USER || "noreply@amoraresort.com"}>`,
      to: process.env.CONTACT_EMAIL || "info@amoraresort.com",
      replyTo: email,
      subject: `[Contact Form] ${subject}`,
      html,
    });
  } catch (error) {
    console.error("Failed to send contact email:", error);
    throw new Error("Failed to send email");
  }
}
