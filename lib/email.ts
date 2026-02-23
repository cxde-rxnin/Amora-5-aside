import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #0d4a2e; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Amora Resort</h1>
        <p style="color: #4ade80; margin: 8px 0 0; font-size: 14px;">5-Aside Football Pitch</p>
      </div>

      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #111827; margin: 0 0 8px;">Booking Confirmed!</h2>
        <p style="color: #6b7280; margin: 0 0 24px;">
          Hi ${customerName}, your pitch booking has been confirmed. Here are the details:
        </p>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Date</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600; color: #111827;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Time</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600; color: #111827;">${startTime} – ${endTime}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Duration</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600; color: #111827;">${duration === 60 ? "1 Hour" : "2 Hours"}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Amount Paid</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600; color: #111827;">NGN ${amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Reference</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #111827; font-size: 12px;">${txRef}</td>
          </tr>
        </table>

        <div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin-top: 24px; text-align: center;">
          <p style="color: #166534; margin: 0; font-weight: 600;">See you on the pitch!</p>
          <p style="color: #6b7280; margin: 8px 0 0; font-size: 13px;">
            Amora Resort, First Mechanics Alakahia, PH
          </p>
        </div>
      </div>

      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Amora Resort. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Amora Resort" <${process.env.SMTP_USER || "noreply@amoraresort.com"}>`,
      to,
      subject: `Booking Confirmed – ${formattedDate} at ${startTime}`,
      html,
    });
  } catch (error) {
    // Log but don't throw — email failure shouldn't break payment flow
    console.error("Failed to send booking confirmation email:", error);
  }
}
