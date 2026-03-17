import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function AdminRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

