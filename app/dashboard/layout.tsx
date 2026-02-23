import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/getCurrentUser";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar user={{ name: user.name, email: user.email }} />
      <main className="flex-1 overflow-y-auto md:ml-64 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
