import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function DashboardRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

