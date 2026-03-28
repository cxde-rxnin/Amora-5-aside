import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { z } from "zod";
import crypto from "crypto";
import nodemailer from "nodemailer";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

// In-memory store for reset tokens (use Redis/DB in production)
// We store: token -> { userId, expires }
const resetTokens = new Map<string, { userId: string; expires: number }>();

export { resetTokens };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const { email } = result.data;

    await dbConnect();
    const user = await User.findOne({ email: email.toLowerCase() }).lean();

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: "If that email exists, a reset link has been sent.",
      });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 1000 * 60 * 60; // 1 hour

    resetTokens.set(token, { userId: user._id.toString(), expires });

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter
      .sendMail({
        from: `"Amora Resort" <${process.env.SMTP_USER || "noreply@amoraresort.com"}>`,
        to: email,
        subject: "Reset Your Password — Amora Resort",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #0d4a2e; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Amora Resort</h1>
          </div>
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="color: #111827;">Reset Your Password</h2>
            <p style="color: #6b7280;">Click the button below to reset your password. This link expires in 1 hour.</p>
            <a href="${resetLink}" style="display: inline-block; margin: 24px 0; padding: 12px 32px; background-color: #16a34a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Reset Password
            </a>
            <p style="color: #9ca3af; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        </div>
      `,
      })
      .catch(console.error);

    return NextResponse.json({
      message: "If that email exists, a reset link has been sent.",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
