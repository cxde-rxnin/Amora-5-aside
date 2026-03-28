/**
 * Base layout for all emails.
 */
const baseLayout = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f7f6;
      color: #333;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #0d4a2e;
      padding: 40px 20px;
      text-align: center;
      border-radius: 12px 12px 0 0;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      letter-spacing: 1px;
    }
    .header p {
      color: #4ade80;
      margin: 8px 0 0;
      font-size: 14px;
      text-transform: uppercase;
      font-weight: 600;
    }
    .content {
      background-color: #ffffff;
      padding: 40px 30px;
      border: 1px solid #e2e8f0;
      border-top: none;
      line-height: 1.6;
    }
    .footer {
      padding: 30px 20px;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #10b981;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      margin: 24px 0;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
    }
    .data-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .data-label {
      color: #64748b;
      font-size: 14px;
    }
    .data-value {
      text-align: right;
      font-weight: 600;
      color: #1e293b;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-success { background-color: #dcfce7; color: #166534; }
    .badge-pending { background-color: #fef9c3; color: #854d0e; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Amora Resort</h1>
      <p>Elite 5-Aside Football</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Amora Resort. All rights reserved.</p>
      <p>First Mechanics Alakahia, PH | <a href="mailto:info@amoraresort.com" style="color: #94a3b8;">info@amoraresort.com</a></p>
    </div>
  </div>
</body>
</html>
`;

export const welcomeTemplate = (name: string) => baseLayout(`
  <h2 style="margin-top: 0; color: #0f172a;">Welcome to the Pitch, ${name}!</h2>
  <p>We're thrilled to have you join the Amora Resort community. Your account is now active and you're ready to start booking slots, joining teams, and competing in tournaments.</p>
  
  <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
    <h3 style="margin-top: 0; color: #0f172a; font-size: 16px;">What's Next?</h3>
    <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">Check out the latest pitch availability or find a team to join.</p>
    <a href="https://amoraresort.com/dashboard" class="button">Go to Dashboard</a>
  </div>

  <p>If you have any questions, feel free to reply to this email or visit our <a href="https://amoraresort.com/contact" style="color: #10b981;">Contact Page</a>.</p>
  <p>Happy playing!</p>
`, "Welcome to Amora Resort");

export const bookingInitiatedTemplate = (data: {
  customerName: string;
  date: string;
  time: string;
  duration: string;
  amount: number;
  paymentLink: string;
}) => baseLayout(`
  <h2 style="margin-top: 0; color: #0f172a;">Booking Initiated</h2>
  <p>Hi ${data.customerName}, we've reserved your slot temporarily. Please complete the payment within 15 minutes to secure your booking.</p>
  
  <table class="data-table">
    <tr>
      <td class="data-label">Status</td>
      <td class="data-value"><span class="badge badge-pending">Payment Required</span></td>
    </tr>
    <tr>
      <td class="data-label">Date</td>
      <td class="data-value">${data.date}</td>
    </tr>
    <tr>
      <td class="data-label">Time</td>
      <td class="data-value">${data.time}</td>
    </tr>
    <tr>
      <td class="data-label">Duration</td>
      <td class="data-value">${data.duration}</td>
    </tr>
    <tr>
      <td class="data-label" style="border-bottom: none;">Amount Due</td>
      <td class="data-value" style="border-bottom: none; font-size: 18px; color: #10b981;">NGN ${data.amount.toLocaleString()}</td>
    </tr>
  </table>

  <div style="text-align: center;">
    <a href="${data.paymentLink}" class="button">Complete Payment Now</a>
  </div>
  
  <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 16px;">
    Note: If payment is not received within 15 minutes, this slot will be released back to the public.
  </p>
`, "Complete Your Booking");

export const bookingConfirmedTemplate = (data: {
  customerName: string;
  date: string;
  time: string;
  duration: string;
  amount: number;
  txRef: string;
}) => baseLayout(`
  <h2 style="margin-top: 0; color: #0f172a;">Booking Confirmed!</h2>
  <p>Hi ${data.customerName}, your pitch booking is officially confirmed. Get your boots ready!</p>
  
  <table class="data-table">
    <tr>
      <td class="data-label">Status</td>
      <td class="data-value"><span class="badge badge-success">Confirmed & Paid</span></td>
    </tr>
    <tr>
      <td class="data-label">Date</td>
      <td class="data-value">${data.date}</td>
    </tr>
    <tr>
      <td class="data-label">Time</td>
      <td class="data-value">${data.time}</td>
    </tr>
    <tr>
      <td class="data-label">Duration</td>
      <td class="data-value">${data.duration}</td>
    </tr>
    <tr>
      <td class="data-label">Amount Paid</td>
      <td class="data-value">NGN ${data.amount.toLocaleString()}</td>
    </tr>
    <tr>
      <td class="data-label" style="border-bottom: none;">Reference</td>
      <td class="data-value" style="border-bottom: none; font-size: 10px; color: #94a3b8;">${data.txRef}</td>
    </tr>
  </table>

  <div style="background-color: #f0fdf4; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
    <p style="margin: 0; font-weight: bold; color: #166534;">Location</p>
    <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Amora Resort, First Mechanics Alakahia, PH</p>
  </div>
  
  <p>Need to reschedule? You can do so up to 12 hours before your booking through your <a href="https://amoraresort.com/dashboard/bookings" style="color: #10b981;">dashboard</a>.</p>
`, "Your Booking is Confirmed");

export const tournamentJoinedTemplate = (data: {
  captainName: string;
  teamName: string;
  tournamentName: string;
  entryFee: number;
  isPaid: boolean;
  paymentLink?: string;
}) => baseLayout(`
  <h2 style="margin-top: 0; color: #0f172a;">Tournament Registration</h2>
  <p>Hi ${data.captainName}, your team <strong>${data.teamName}</strong> has been registered for <strong>${data.tournamentName}</strong>.</p>
  
  <table class="data-table">
    <tr>
      <td class="data-label">Status</td>
      <td class="data-value">
        ${data.isPaid
    ? '<span class="badge badge-success">Registration Confirmed</span>'
    : '<span class="badge badge-pending">Payment Pending</span>'}
      </td>
    </tr>
    <tr>
      <td class="data-label">Tournament</td>
      <td class="data-value">${data.tournamentName}</td>
    </tr>
    <tr>
      <td class="data-label">Team</td>
      <td class="data-value">${data.teamName}</td>
    </tr>
    <tr>
      <td class="data-label" style="border-bottom: none;">Entry Fee</td>
      <td class="data-value" style="border-bottom: none;">NGN ${data.entryFee.toLocaleString()}</td>
    </tr>
  </table>

  ${!data.isPaid && data.paymentLink ? `
    <div style="text-align: center; margin: 32px 0;">
      <p style="font-size: 14px; color: #64748b; margin-bottom: 16px;">Please complete your entry fee payment to finalize your spot.</p>
      <a href="${data.paymentLink}" class="button">Pay Entry Fee</a>
    </div>
  ` : `
    <div style="background-color: #f0fdf4; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
      <p style="margin: 0; font-weight: bold; color: #166534;">You're in the Game!</p>
      <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Keep an eye on your dashboard for fixture announcements.</p>
    </div>
  `}
`, data.isPaid ? "Registration Confirmed" : "Complete Tournament Entry");

export const teamJoinTemplate = (data: {
  playerName: string;
  teamName: string;
  captainName: string;
}) => baseLayout(`
  <h2 style="margin-top: 0; color: #0f172a;">New Squad Member!</h2>
  <p>Hi ${data.captainName}, <strong>${data.playerName}</strong> has just joined your team <strong>${data.teamName}</strong>.</p>
  
  <div style="background-color: #f0f9ff; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
    <p style="margin: 0; font-weight: bold; color: #0369a1;">Squad Growth</p>
    <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Your roster is getting stronger. Check out your new player's stats on the dashboard.</p>
  </div>

  <div style="text-align: center;">
    <a href="https://amoraresort.com/dashboard/teams" class="button">View Team Roster</a>
  </div>
`, "New Player Joined Your Team");
