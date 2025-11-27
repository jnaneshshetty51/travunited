import { prisma } from "@/lib/prisma";

type AdminRole = "STAFF_ADMIN" | "SUPER_ADMIN";

export async function getAdminUserIds(
  roles: AdminRole[] = ["STAFF_ADMIN", "SUPER_ADMIN"]
) {
  const admins = await prisma.user.findMany({
    where: {
      role: {
        in: roles,
      },
    },
    select: { id: true },
  });

  return admins.map((admin) => admin.id);
}

export function getVisaAdminEmail() {
  return (
    process.env.ADMIN_VISA_EMAIL ||
    process.env.ADMIN_SUPPORT_EMAIL ||
    process.env.SUPPORT_EMAIL ||
    null
  );
}

export function getTourAdminEmail() {
  return (
    process.env.ADMIN_TOURS_EMAIL ||
    process.env.ADMIN_SUPPORT_EMAIL ||
    process.env.SUPPORT_EMAIL ||
    null
  );
}

export function getSupportAdminEmail() {
  return process.env.ADMIN_SUPPORT_EMAIL || process.env.SUPPORT_EMAIL || null;
}

