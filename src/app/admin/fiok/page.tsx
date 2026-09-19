import type { Metadata } from "next";
import { logoutAction } from "@/app/actions/auth";
import { AccountForms } from "@/components/admin/editors/AccountForms";
import { AdminPageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guard";

export const metadata: Metadata = { title: "Fiók – Admin" };

export default async function AdminAccountPage() {
  const session = await requireAdminPage();
  // Csak azt jelezzük, hogy van-e még kezdő jelszó a .env.local-ban – magát a jelszót soha nem.
  const initialPasswordInEnv = Boolean(process.env.ADMIN_PASSWORD?.trim());
  return (
    <>
      <AdminPageHeader
        title="Fiók"
        description={`Belépve mint: ${session.username}. Itt változtathatod meg a jelszavad és a felhasználóneved.`}
      />
      <AccountForms username={session.username} logoutAction={logoutAction} initialPasswordInEnv={initialPasswordInEnv} />
    </>
  );
}
