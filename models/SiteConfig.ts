import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISiteConfig extends Document {
    heroTitle: string;
    heroSubtitle: string;
    pitchOffPeakPrice: number;
    pitchPeakPrice: number;
    pitchWeekendPrice: number;
    tournamentEntryFee: number;
    updatedAt: Date;
}

const siteConfigSchema = new Schema<ISiteConfig>(
    {
        heroTitle: {
            type: String,
            default: "The Ultimate 5-Aside Football Experience",
        },
        heroSubtitle: {
            type: String,
            default: "Play on premium turf, join competitive tournaments, and track your stats like a pro.",
        },
        pitchOffPeakPrice: {
            type: Number,
            default: 15000,
        },
        pitchPeakPrice: {
            type: Number,
            default: 20000,
        },
        pitchWeekendPrice: {
            type: Number,
            default: 25000,
        },
        tournamentEntryFee: {
            type: Number,
            default: 50000,
        },
    },
    {
        timestamps: true,
    }
);

const SiteConfig: Model<ISiteConfig> =
    mongoose.models.SiteConfig ||
    mongoose.model<ISiteConfig>("SiteConfig", siteConfigSchema);

export default SiteConfig;
