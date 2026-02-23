require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const fs = require("fs");

async function checkFlutterwave(txId) {
    const secret = process.env.FLUTTERWAVE_SECRET_KEY;
    const res = await fetch(`https://api.flutterwave.com/v3/transactions/${txId}/verify`, {
        headers: { Authorization: `Bearer ${secret}` }
    });
    return await res.json();
}

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);

    // Re-create the exact schema that the API uses to see if a validator or type error causes passive failure
    const paymentSchema = new mongoose.Schema({
        status: { type: String, enum: ["pending", "successful", "failed"], default: "pending" },
        flutterwaveTxId: { type: String, default: null },
        paymentMethod: { type: String, default: "" },
        amount: { type: Number },
        currency: { type: String }
    });

    const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

    const p = await Payment.findOne({ status: "pending" });
    if (!p) {
        console.log("No pending payment found.");
        process.exit(0);
    }

    console.log("Found payment:", p._id, "with status", p.status);

    try {
        const verification = await checkFlutterwave("10038132");

        const payment = await Payment.findById(p._id).lean();
        console.log("Lean payment:", payment._id);

        console.log("Updating payment...");

        const updatedPayment = await Payment.findByIdAndUpdate(payment._id, {
            status: "successful",
            flutterwaveTxId: "10038132",
            paymentMethod: verification.data.payment_type || ""
        }, { new: true });

        console.log("Update result is:", updatedPayment.status);

        // Check if it actually changed
        const verifyUpdated = await Payment.findById(payment._id).lean();
        console.log("Database status is now:", verifyUpdated.status);

    } catch (err) {
        console.error("Error during update:", err);
    }

    process.exit(0);
}

run();
