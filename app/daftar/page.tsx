"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { cloudConfigured } from "@/lib/supabase/config";
import { useStore } from "@/lib/store";

export default function DaftarPage() {
  const router = useRouter();
  const { session, signUpEmail } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = cloudConfigured();

  useEffect(() => {
    if (session) router.replace("/");
  }, [session, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signUpEmail(name.trim(), email.trim(), password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal daftar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-16">
      <div className="w-full max-w-md border border-[#e5e5e5] p-8">
        <p className="font-[family-name:var(--font-display)] text-3xl tracking-[0.18em] uppercase">Henima</p>
        <p className="mt-2 text-sm text-[#737373]">
          Akun pertama jadi admin. Akun berikutnya jadi sales sampai admin mengganti perannya.
        </p>

        {!ready ? (
          <p className="mt-6 text-sm text-[#737373]">
            Server belum dihubungkan.{" "}
            <Link href="/setup" className="underline">
              Buka setup dulu
            </Link>
            .
          </p>
        ) : (
          <form className="mt-6 space-y-3" onSubmit={onSubmit}>
            <Field label="Nama">
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="mis. Mahendra"
                required
              />
            </Field>
            <Field label="Email">
              <input
                className={inputClass}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Kata sandi">
              <input
                className={inputClass}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </Field>
            {error ? <p className="text-sm text-[#111111]">{error}</p> : null}
            <Button className="mt-3 w-full" type="submit" disabled={busy}>
              {busy ? "Mendaftar…" : "Daftar"}
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-[#737373]">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
