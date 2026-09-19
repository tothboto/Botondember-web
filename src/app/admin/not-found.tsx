import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
      <p className="font-royal text-6xl font-bold text-link">404</p>
      <h1 className="font-display text-2xl font-black">Ez az Admin oldal nem található.</h1>
      <Link href="/admin" className="inline-block rounded-xl bg-primary px-5 py-3 font-bold text-primary-fg">
        Vissza az Irányítópultra
      </Link>
    </div>
  );
}
