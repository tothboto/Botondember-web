"use client";

import { Eye, EyeOff, LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { changePassword, changeUsername, logoutOtherSessions } from "@/app/actions/admin/account";
import { useToast } from "../Toast";
import { Button, Card, Field, TextInput } from "../ui";

/** Egyszerű jelszóerősség-becslés (csak tájékoztató jellegű). */
function strength(password: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (password.length === 0) return { score: 0, label: "" };
  const kinds = [/[a-záéíóöőúüű]/, /[A-ZÁÉÍÓÖŐÚÜŰ]/, /\d/, /[^\p{L}\p{N}]/u].filter((re) => re.test(password)).length;
  if (password.length < 8) return { score: 0, label: "Túl rövid (legalább 8 karakter kell)" };
  if (password.length >= 14 && kinds >= 3) return { score: 3, label: "Erős" };
  if (password.length >= 10 && kinds >= 2) return { score: 2, label: "Közepes – lehetne hosszabb" };
  return { score: 1, label: "Gyenge – legyen hosszabb, és keverj bele számot, jelet" };
}

function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  invalid?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <TextInput
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        autoComplete={autoComplete}
        spellCheck={false}
        maxLength={200}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid || undefined}
        className="pr-12"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Jelszó elrejtése" : "Jelszó megjelenítése"}
        aria-pressed={visible}
        className="absolute top-1/2 right-1.5 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg hover:bg-surface-2"
      >
        {visible ? <EyeOff aria-hidden className="h-4 w-4" /> : <Eye aria-hidden className="h-4 w-4" />}
      </button>
    </div>
  );
}

function PasswordForm({ username }: { username: string }) {
  const router = useRouter();
  const toast = useToast();
  const empty = { currentPassword: "", newPassword: "", confirmPassword: "" };
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const meter = strength(values.newPassword);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const result = await changePassword(values);
    setSaving(false);
    if (result.ok) {
      setValues(empty);
      setErrors({});
      toast.success("Mentve! Az új jelszó érvényes. A többi eszközön újra be kell lépni.");
      router.refresh();
    } else {
      setErrors(result.fieldErrors ?? {});
      toast.error(result.error);
    }
  };

  return (
    <Card title="Jelszó megváltoztatása" description="Tipp: egy hosszú mondat (pl. három-négy szó számmal) erősebb és könnyebben megjegyezhető, mint egy rövid, bonyolult jelszó.">
      <form onSubmit={submit} className="max-w-xl space-y-5" noValidate>
        {/* Rejtett felhasználónév mező a jelszókezelőknek (hogy tudják, melyik fiókhoz tartozik). */}
        <input type="text" name="username" autoComplete="username" value={username} readOnly hidden />
        <Field label="Jelenlegi jelszó" htmlFor="account-current-password" error={errors.currentPassword}>
          <PasswordInput
            id="account-current-password"
            value={values.currentPassword}
            autoComplete="current-password"
            invalid={Boolean(errors.currentPassword)}
            onChange={(currentPassword) => setValues((v) => ({ ...v, currentPassword }))}
          />
        </Field>
        <Field label="Új jelszó" htmlFor="account-new-password" error={errors.newPassword} hint="Legalább 8 karakter; 12 vagy több az ajánlott.">
          <PasswordInput
            id="account-new-password"
            value={values.newPassword}
            autoComplete="new-password"
            invalid={Boolean(errors.newPassword)}
            onChange={(newPassword) => setValues((v) => ({ ...v, newPassword }))}
          />
        </Field>
        {values.newPassword && (
          <div aria-live="polite" className="space-y-1.5">
            <div className="grid grid-cols-3 gap-1.5" aria-hidden>
              {[1, 2, 3].map((level) => (
                <span
                  key={level}
                  className={`h-2 rounded-full ${
                    meter.score >= level
                      ? meter.score === 3
                        ? "bg-emerald-600"
                        : meter.score === 2
                          ? "bg-amber-500"
                          : "bg-red-600"
                      : "bg-surface-2"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm font-semibold">Erősség: {meter.label}</p>
          </div>
        )}
        <Field label="Új jelszó még egyszer" htmlFor="account-confirm-password" error={errors.confirmPassword}>
          <PasswordInput
            id="account-confirm-password"
            value={values.confirmPassword}
            autoComplete="new-password"
            invalid={Boolean(errors.confirmPassword)}
            onChange={(confirmPassword) => setValues((v) => ({ ...v, confirmPassword }))}
          />
        </Field>
        <Button type="submit" disabled={saving || !values.currentPassword || !values.newPassword}>
          {saving ? "Mentés…" : "Jelszó megváltoztatása"}
        </Button>
      </form>
    </Card>
  );
}

function UsernameForm({ username }: { username: string }) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState({ username, currentPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const result = await changeUsername(values);
    setSaving(false);
    if (result.ok) {
      setValues((v) => ({ ...v, currentPassword: "" }));
      setErrors({});
      toast.success("Mentve! Mostantól az új felhasználóneveddel lépj be.");
      router.refresh();
    } else {
      setErrors(result.fieldErrors ?? {});
      toast.error(result.error);
    }
  };

  return (
    <Card title="Felhasználónév">
      <form onSubmit={submit} className="max-w-xl space-y-5" noValidate>
        <Field label="Új felhasználónév" htmlFor="account-username" error={errors.username} hint="Betű, szám, pont, kötőjel vagy aláhúzás – szóköz nélkül.">
          <TextInput
            id="account-username"
            value={values.username}
            maxLength={40}
            autoComplete="username"
            spellCheck={false}
            autoCapitalize="off"
            onChange={(event) => setValues((v) => ({ ...v, username: event.target.value }))}
          />
        </Field>
        <Field label="Jelenlegi jelszó (a megerősítéshez)" htmlFor="account-username-password" error={errors.currentPassword}>
          <PasswordInput
            id="account-username-password"
            value={values.currentPassword}
            autoComplete="current-password"
            invalid={Boolean(errors.currentPassword)}
            onChange={(currentPassword) => setValues((v) => ({ ...v, currentPassword }))}
          />
        </Field>
        <Button type="submit" disabled={saving || values.username.trim() === username || !values.currentPassword}>
          {saving ? "Mentés…" : "Felhasználónév megváltoztatása"}
        </Button>
      </form>
    </Card>
  );
}

/** Fiók: felhasználónév és jelszó cseréje (a régi jelszóval), kilépés. */
export function AccountForms({
  username,
  logoutAction,
  initialPasswordInEnv,
}: {
  username: string;
  logoutAction: () => Promise<void>;
  initialPasswordInEnv: boolean;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      {initialPasswordInEnv && (
        <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-amber-950 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-50 dark:ring-amber-800">
          <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold">Biztonsági tipp</p>
            <p>
              A kezdő jelszó még ott van a projekt <code>.env.local</code> fájljában (<code>ADMIN_PASSWORD</code>). Változtasd
              meg itt a jelszót, utána töröld ki a fájlból az <code>ADMIN_PASSWORD=</code> sor végéről a régi jelszót – az oldalnak
              már nincs rá szüksége.
            </p>
          </div>
        </div>
      )}
      <PasswordForm username={username} />
      <UsernameForm username={username} />
      <Card title="Kilépés">
        <div className="flex flex-wrap gap-3">
          <form action={logoutAction}>
            <Button type="submit" tone="secondary">
              <LogOut aria-hidden className="h-4 w-4" />
              Kilépés ezen az eszközön
            </Button>
          </form>
          <Button
            tone="secondary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await logoutOtherSessions();
                if (result.ok) toast.success("Kész! Minden más eszközön kiléptél, itt belépve maradtál.");
                else toast.error(result.error);
              })
            }
          >
            Kilépés minden más eszközön
          </Button>
        </div>
      </Card>
    </div>
  );
}
