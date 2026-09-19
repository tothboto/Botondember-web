import type { MetadataRoute } from "next";
import { getAllSettings } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

/**
 * Keresők: alapból az egész oldal rejtve van (az Adminban kapcsolható).
 * Az admin felület soha nem kerülhet a keresőkbe.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const { general } = await getAllSettings();
  if (general.noindex) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] } };
}
