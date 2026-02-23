require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const fs = require("fs");

async function dump() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;

        const payments = await db.collection("payments").find({}).sort({ createdAt: -1 }).limit(1).toArray();
        const bookings = await db.collection("bookings").find({}).sort({ createdAt: -1 }).limit(1).toArray();

        const output = {
            latestPayment: payments[0],
            latestBooking: bookings[0]
        };

        fs.writeFileSync("db-dump.json", JSON.stringify(output, null, 2));
        console.log("Dump successful");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
dump();
