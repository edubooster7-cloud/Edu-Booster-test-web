import { AccountDeletedClient } from "@/components/auth/account-deleted-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restauration de compte | EduBooster",
  description:
    "Annulez la suppression de votre compte et restaurez vos données EduBooster.",
  robots: "noindex, nofollow",
};

export default function AccountDeletedPage() {
  return <AccountDeletedClient />;
}
