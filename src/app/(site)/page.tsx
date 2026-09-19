import type { Metadata } from "next";
import Image from "next/image";
import { getImages } from "@/lib/data/media";
import { getAllSettings } from "@/lib/data/settings";
import { getI18n } from "@/lib/i18n/server";
import type { FocalPoint } from "@/lib/settings";

/** A kép fókuszpontja (az Adminban választható) → CSS object-position. */
const FOCAL_POSITION: Record<FocalPoint, string> = {
  center: "50% 50%",
  top: "50% 18%",
  bottom: "50% 82%",
  left: "22% 50%",
  right: "78% 50%",
};

export async function generateMetadata(): Promise<Metadata> {
  const [{ home, general }, images] = await Promise.all([getAllSettings(), getImages()]);
  const hero = images(home.heroMediaId);
  const description = home.subtitle || home.message;
  return {
    title: { absolute: general.siteName },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      title: general.siteName,
      description,
      images: hero ? [{ url: hero.src, width: hero.width, height: hero.height, alt: hero.alt }] : undefined,
    },
  };
}

/**
 * Kezdőlap – a Rainbow Six Siege weboldal hangulatában, de nagyon minimalistán:
 * egyetlen teljes képernyős kép sötét rátéttel és egy rövid, ütős üzenet.
 * Semmi más: nincs galéria, számláló, óra vagy animáció.
 */
export default async function HomePage() {
  const [{ home }, images, { t }] = await Promise.all([getAllSettings(), getImages(), getI18n()]);
  const hero = images(home.heroMediaId);
  const a = home.overlay / 100;
  const shade = (k: number) => `rgb(3 7 16 / ${Math.min(1, a * k).toFixed(3)})`;

  return (
    <section className="tpl-home relative isolate flex min-h-[100svh] items-end overflow-hidden bg-[#050b17] text-white">
      {hero ? (
        <Image
          src={hero.src}
          alt={hero.alt}
          fill
          preload
          sizes="100vw"
          className="-z-20 object-cover"
          style={{ objectPosition: FOCAL_POSITION[home.focal] }}
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-[radial-gradient(80%_70%_at_25%_35%,#00529f66,transparent),linear-gradient(160deg,#060b16,#0b1f3f_55%,#04070d)]"
        />
      )}

      {/* Sötét színátmenetes rátét – az erőssége az Adminban állítható. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(to top, ${shade(1)} 0%, ${shade(0.62)} 38%, ${shade(0.22)} 72%, ${shade(0.45)} 100%), linear-gradient(to right, ${shade(0.75)} 0%, transparent 68%)`,
        }}
      />

      <div className="container-page pt-44 pb-[max(4.5rem,11vh)]">
        <div className="max-w-6xl">
          <span aria-hidden className="mb-7 block h-1.5 w-24 bg-[image:var(--gold-gradient)]" />
          <h1
            lang="hu"
            className="font-display text-[clamp(2.5rem,6.2vw,5.75rem)] leading-[0.95] font-black tracking-tight text-balance uppercase [text-shadow:0_2px_28px_rgb(0_0_0/0.45)]"
          >
            {home.message}
          </h1>

          {home.subtitle && (
            <p lang="hu" className="mt-7 max-w-2xl text-lg text-white/90 sm:text-xl">
              {home.subtitle}
            </p>
          )}

          {home.motto.enabled && home.motto.text && (
            <figure className="mt-10 max-w-xl border-l-4 border-rm-gold pl-5">
              <figcaption className="sr-only">{t("home.motto")}</figcaption>
              <blockquote lang="hu" className="text-lg text-white/90 italic sm:text-xl">
                „{home.motto.text}”
              </blockquote>
              {home.motto.author && (
                <p lang="hu" className="mt-2 text-sm font-bold tracking-[0.2em] text-rm-gold uppercase">
                  — {home.motto.author}
                </p>
              )}
            </figure>
          )}
        </div>
      </div>
    </section>
  );
}
