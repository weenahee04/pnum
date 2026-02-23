"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  // LINE user ที่ยังไม่ verify → redirect ไปหน้ายืนยันตัวตน
  if (session.user.needsVerification) {
    router.push("/verify");
    return null;
  }

  return (
    <div className="min-h-screen bg-background-light">
      <Sidebar
        user={{
          name: session.user.name || "",
          email: session.user.email || "",
          role: session.user.role || "EMPLOYEE",
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Header
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        userName={session.user.name || ""}
      />
      <main className="lg:ml-72 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
