import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SiteConfig from "@/models/SiteConfig";

export async function GET() {
    try {
        await dbConnect();
        let config = await SiteConfig.findOne().lean();

        if (!config) {
            config = await SiteConfig.create({});
        }

        return NextResponse.json({ config });
    } catch (error) {
        console.error("SiteConfig GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
