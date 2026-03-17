"use client";

import { useSession } from "next-auth/react";
import { NotificationBell } from "../notifications/NotificationBell";

export function AdminHeader() {
  const { data: session } = useSession();

  return (
    <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-neutral-200 px-4 py-3 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">
            Admin Dashboard
          </h1>
          {session?.user?.email && (
            <p className="text-sm text-neutral-600">{session.user.email}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <NotificationBell />
        </div>
      </div>
    </div>
  );
}

