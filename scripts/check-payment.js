require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const fs = require("fs");

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Payment = mongoose.models.Payment || mongoose.model("Payment", new mongoose.Schema({
        status: String, txRef: String, amount: Number, currency: String, bookingId: mongoose.Schema.Types.ObjectId
    }, { strict: false }));

    const Booking = mongoose.models.Booking || mongoose.model("Booking", new mongoose.Schema({
        status: String
    }, { strict: false }));

    const data = await Payment.find().sort({ createdAt: -1 }).limit(1).lean();
    let booking = null;
    if (data[0] && data[0].bookingId) {
        booking = await Booking.findById(data[0].bookingId).lean();
    }

    fs.writeFileSync("db.json", JSON.stringify({ payment: data[0], booking }, null, 2));
    process.exit(0);
}

run();
