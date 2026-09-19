"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { saveHome } from "@/app/actions/admin/settings";
import type { FocalPoint, HomeSettings } from "@/lib/settings";
import { MediaField } from "../MediaField";
import { useMediaLibrary } from "../MediaLibrary";
import { useToast } from "../Toast";
import { Button, Card, Field, TextArea, TextInput, Toggle } from "../ui";
import { useUnsavedChanges } from "../useUnsavedChanges";

const FOCAL: { value: FocalPoint; label: string; position: string }[] = [
  { value: "top", label: "Fent", position: "50% 18%" },
  { value: "left", label: "Bal", position: "22% 50%" },
  { value: "center", label: "Közép", position: "50% 50%" },
  { value: "right", label: "Jobb", position: "78% 50%" },
  { value: "bottom", label: "Lent", position: "50% 82%" },
];

/** Kezdőlap: hero kép, fókuszpont, rátét erőssége, fő üzenet, alcím, mottó – élő előnézettel. */
export function HomeForm({ initial }: { initial: HomeSettings }) {
  const router = useRouter();
  const toast = useToast();
  const library = useMediaLibrary();
  const [values, setValues] = useState<HomeSettings>(initial);
  const initialAlt = library.byId(initial.heroMediaId)?.alt ?? "";
  const [alt, setAlt] = useState(initialAlt);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = JSON.stringify(values) !== JSON.stringify(initial) || alt !== initialAlt;
  useUnsavedChanges(dirty);

  const hero = library.byId(values.heroMediaId);
  const a = values.overlay / 100;
  const shade = (k: number) => `rgb(3 7 16 / ${Math.min(1, a * k).toFixed(3)})`;
  const focal = FOCAL.find((f) => f.value === values.focal) ?? FOCAL[2];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const result = await saveHome(values, values.heroMediaId ? { [String(values.heroMediaId)]: alt } : undefined);
    setSaving(false);
    if (result.ok) {
      if (values.heroMediaId) library.updateAlt(values.heroMediaId, alt.trim());
      setErrors({});
      toast.success("Mentve! A kezdőlap már az új változatot mutatja.");
      router.refresh();
    } else {
      setErrors(result.fieldErrors ?? {});
      toast.error(result.error);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" noValidate>
      <div className="space-y-8">
        <Card title="Kép">
          <div className="space-y-5">
            <MediaField
              id="home-hero"
              label="A kezdőlap nagy képe (pl. egy fotó rólad)"
              value={values.heroMediaId}
              alt={alt}
              onAltChange={setAlt}
              aspect="16 / 9"
              hint="Fekvő, nagy felbontású kép a legszebb (legalább 1920 px széles)."
              onChange={(heroMediaId, media) => {
                setValues((v) => ({ ...v, heroMediaId }));
                if (media) setAlt(media.alt);
              }}
            />
            <fieldset>
              <legend className="font-semibold">A kép fókuszpontja (melyik része maradjon mindig látható?)</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {FOCAL.map((option) => (
                  <label key={option.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="home-focal"
                      value={option.value}
                      checked={values.focal === option.value}
                      onChange={() => setValues((v) => ({ ...v, focal: option.value }))}
                      className="peer sr-only"
                    />
                    <span className="inline-block rounded-xl border border-line px-4 py-2 font-semibold peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-fg peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Field
              label={`A sötét rátét erőssége: ${values.overlay}%`}
              htmlFor="home-overlay"
              hint="Minél világosabb a kép, annál erősebb rátét kell, hogy a szöveg jól olvasható legyen."
            >
              <input
                id="home-overlay"
                type="range"
                min={0}
                max={90}
                step={5}
                value={values.overlay}
                onChange={(event) => setValues((v) => ({ ...v, overlay: Number(event.target.value) }))}
                className="w-full accent-[var(--primary)]"
              />
            </Field>
          </div>
        </Card>

        <Card title="Szöveg">
          <div className="space-y-5">
            <Field label="Fő üzenet (nagy, vastag, nagybetűs)" htmlFor="home-message" error={errors.message}>
              <TextArea
                id="home-message"
                rows={2}
                maxLength={200}
                value={values.message}
                onChange={(event) => setValues((v) => ({ ...v, message: event.target.value }))}
              />
            </Field>
            <Field label="Alcím (nem kötelező)" htmlFor="home-subtitle" error={errors.subtitle}>
              <TextInput
                id="home-subtitle"
                maxLength={300}
                value={values.subtitle}
                onChange={(event) => setValues((v) => ({ ...v, subtitle: event.target.value }))}
              />
            </Field>
            <Toggle
              id="home-motto-enabled"
              label="Mottó megjelenítése"
              checked={values.motto.enabled}
              onChange={(enabled) => setValues((v) => ({ ...v, motto: { ...v.motto, enabled } }))}
            />
            {values.motto.enabled && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Mottó szövege" htmlFor="home-motto-text">
                  <TextInput
                    id="home-motto-text"
                    maxLength={300}
                    value={values.motto.text}
                    onChange={(event) => setValues((v) => ({ ...v, motto: { ...v.motto, text: event.target.value } }))}
                  />
                </Field>
                <Field label="Szerző (nem kötelező)" htmlFor="home-motto-author">
                  <TextInput
                    id="home-motto-author"
                    maxLength={100}
                    value={values.motto.author}
                    onChange={(event) => setValues((v) => ({ ...v, motto: { ...v.motto, author: event.target.value } }))}
                  />
                </Field>
              </div>
            )}
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving || !dirty} className="px-6 py-3 text-lg">
            {saving ? "Mentés…" : "Mentés"}
          </Button>
          {dirty && <span className="font-semibold text-amber-700 dark:text-amber-300">Mentetlen változások</span>}
        </div>
      </div>

      {/* Élő előnézet */}
      <div className="xl:sticky xl:top-24 xl:self-start">
        <p className="mb-2 font-semibold">Előnézet</p>
        <div className="relative isolate flex aspect-[16/10] items-end overflow-hidden rounded-2xl bg-[#050b17] text-white shadow-lg">
          {hero && (
            <Image
              src={hero.src}
              alt=""
              fill
              sizes="(min-width: 1280px) 40vw, 100vw"
              className="-z-20 object-cover"
              style={{ objectPosition: focal.position }}
            />
          )}
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background: `linear-gradient(to top, ${shade(1)} 0%, ${shade(0.62)} 38%, ${shade(0.22)} 72%, ${shade(0.45)} 100%), linear-gradient(to right, ${shade(0.75)} 0%, transparent 68%)`,
            }}
          />
          <div className="p-5 sm:p-7">
            <span aria-hidden className="mb-3 block h-1 w-12 bg-[image:var(--gold-gradient)]" />
            <p lang="hu" className="font-display text-2xl leading-[0.95] font-black tracking-tight text-balance uppercase sm:text-4xl">
              {values.message || "…"}
            </p>
            {values.subtitle && <p className="mt-3 text-sm text-white/90 sm:text-base">{values.subtitle}</p>}
            {values.motto.enabled && values.motto.text && (
              <p className="mt-4 border-l-4 border-rm-gold pl-3 text-sm italic">
                „{values.motto.text}”{values.motto.author && <span className="not-italic text-rm-gold"> — {values.motto.author}</span>}
              </p>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
