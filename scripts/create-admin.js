require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI in .env.local");
    process.exit(1);
}

const adminEmail = "admin@amora.com";
const adminPassword = "password123";

async function createAdmin() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("Connected successfully");

        // Load or define a lightweight version of the User model just for the script
        const userSchema = new mongoose.Schema({
            name: String,
            email: { type: String, unique: true },
            password: { type: String, select: false },
            role: { type: String, default: "customer" },
        }, { timestamps: true });

        const User = mongoose.models.User || mongoose.model("User", userSchema);

        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            if (existingAdmin.role === "admin") {
                console.log(`Admin user ${adminEmail} already exists and has admin privileges!`);
            } else {
                console.log(`User ${adminEmail} already exists. Upgrading to admin...`);
                existingAdmin.role = "admin";
                await existingAdmin.save();
                console.log("Successfully upgraded to admin.");
            }
        } else {
            console.log(`Creating new admin user: ${adminEmail}`);
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            await User.create({
                name: "Amora Admin",
                email: adminEmail,
                password: hashedPassword,
                role: "admin",
            });
            console.log("Successfully created admin user.");
        }

        console.log(`\n--- Admin Credentials ---`);
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log(`Role: admin`);
        console.log(`-------------------------\n`);

    } catch (err) {
        console.error("Error creating admin:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
        process.exit(0);
    }
}

createAdmin();
