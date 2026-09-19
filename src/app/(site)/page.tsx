import { getAllSettings } from "@/lib/data/settings";

/** Kezdőlap – ideiglenes változat (a teljes hero a 3. mérföldkőben készül el). */
export default async function HomePage() {
  const { home } = await getAllSettings();
  return (
    <section className="tpl-home relative grid min-h-[100svh] place-items-center bg-rm-navy text-white">
      <h1 lang="hu" className="container-page font-display text-5xl font-black uppercase">
        {home.message}
      </h1>
    </section>
  );
}
