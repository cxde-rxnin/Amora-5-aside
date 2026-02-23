import dbConnect from "@/lib/mongodb";
import User, { type IUser } from "@/models/User";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
}

function sanitizeUser(user: IUser): SafeUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const token = await getTokenFromCookies();
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    await dbConnect();

    const user = await User.findById(payload.userId).lean<IUser>();
    if (!user) return null;

    return sanitizeUser(user);
  } catch {
    return null;
  }
}
