import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/getCurrentUser";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/admin/dashboard");
  }
  if (user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar user={{ name: user.name, email: user.email }} />
      <main className="flex-1 overflow-y-auto md:ml-64 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
