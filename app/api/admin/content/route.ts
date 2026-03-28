import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SiteConfig from "@/models/SiteConfig";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { logAdminAction } from "@/lib/audit";

export async function GET() {
    try {
        await dbConnect();
        let config = await SiteConfig.findOne().lean();

        if (!config) {
            // Create default config if none exists
            config = await SiteConfig.create({});
        }

        return NextResponse.json({ config });
    } catch (error) {
        console.error("SiteConfig GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        await dbConnect();

        let config = await SiteConfig.findOne();
        if (!config) {
            config = new SiteConfig({});
        }

        const oldValues = { ...config.toObject() };

        // Update fields
        const allowedFields = [
            "heroTitle",
            "heroSubtitle",
            "pitchOffPeakPrice",
            "pitchPeakPrice",
            "pitchWeekendPrice",
            "tournamentEntryFee",
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                (config as any)[field] = body[field];
            }
        }

        await config.save();

        await logAdminAction(user.id, "update_site_content", "system", config._id, {
            updatedFields: Object.keys(body).filter(k => allowedFields.includes(k)),
        });

        return NextResponse.json({ message: "Site configuration updated", config });
    } catch (error) {
        console.error("SiteConfig PATCH error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
