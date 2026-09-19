import type { ReactNode } from "react";
import { SiteChrome } from "@/components/site/SiteChrome";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
