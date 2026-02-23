require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    const payments = await db.collection("payments").find({ bookingId: new mongoose.Types.ObjectId("699c465c7afd012a366909a7") }).toArray();

    console.log("Payments for booking 699c465c7afd012a366909a7:");
    payments.forEach(p => console.log(p._id, p.status, p.txRef));

    process.exit(0);
}
run();
