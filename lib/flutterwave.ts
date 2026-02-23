/**
 * Flutterwave payment integration utilities.
 *
 * Uses Flutterwave v3 REST API directly (no SDK dependency).
 * Docs: https://developer.flutterwave.com/docs
 */

const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY!;
const FLW_BASE_URL = "https://api.flutterwave.com/v3";

export interface FlutterwaveInitPayload {
  tx_ref: string;
  amount: number;
  currency: string;
  redirect_url: string;
  customer: {
    email: string;
    name: string;
    phonenumber?: string;
  };
  customizations: {
    title: string;
    description: string;
    logo?: string;
  };
  meta?: Record<string, string>;
}

export interface FlutterwaveInitResponse {
  status: string;
  message: string;
  data: {
    link: string;
  };
}

export interface FlutterwaveVerifyResponse {
  status: string;
  message: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
    status: string;
    payment_type: string;
    customer: {
      email: string;
      name: string;
      phone_number: string;
    };
  };
}

/** Generate a unique transaction reference */
export function generateTxRef(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `AMORA-${timestamp}-${random}`;
}

/** Calculate the price for a booking based on duration and time */
export function calculateBookingAmount(
  startTime: string,
  duration: number
): number {
  const hour = parseInt(startTime.split(":")[0], 10);
  // Peak hours: Mon-Fri 4PM-10PM (16-22) + all weekends handled on frontend
  // Simplified pricing: peak = 25000/hr, off-peak = 15000/hr
  const isPeak = hour >= 16;
  const hourlyRate = isPeak ? 25000 : 15000;
  return hourlyRate * (duration / 60);
}

/** Initialize a Flutterwave payment and get the payment link */
export async function initiateFlutterwavePayment(
  payload: FlutterwaveInitPayload
): Promise<FlutterwaveInitResponse> {
  const res = await fetch(`${FLW_BASE_URL}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FLW_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      `Flutterwave payment initiation failed: ${errorData.message || res.statusText}`
    );
  }

  return res.json();
}

/** Verify a Flutterwave transaction by its ID */
export async function verifyFlutterwaveTransaction(
  transactionId: string
): Promise<FlutterwaveVerifyResponse> {
  const res = await fetch(
    `${FLW_BASE_URL}/transactions/${transactionId}/verify`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      `Flutterwave verification failed: ${errorData.message || res.statusText}`
    );
  }

  return res.json();
}

/** Verify Flutterwave webhook signature */
export function verifyWebhookSignature(
  secretHash: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) return false;
  return secretHash === signatureHeader;
}
