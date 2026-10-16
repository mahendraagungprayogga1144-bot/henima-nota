"use client";

import Link from "next/link";
import { cloudConfigured } from "@/lib/supabase/config";

export default function SetupPage() {
  const ready = cloudConfigured();

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <p className="font-[family-name:var(--font-display)] text-3xl tracking-[0.18em] uppercase">Henima</p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-[32px] leading-none">Hubungkan server</h1>
      <p className="mt-3 text-sm text-[#737373]">
        Gratis. Setelah ini, nota dan stok tidak hanya di satu laptop. Tim bisa masuk dari HP atau laptop lain.
      </p>

      {ready ? (
        <p className="mt-6 border border-[#111111] px-4 py-3 text-sm">
          Kunci server sudah terpasang.{" "}
          <Link href="/daftar" className="underline">
            Daftar akun pertama
          </Link>{" "}
          atau{" "}
          <Link href="/masuk" className="underline">
            masuk
          </Link>
          .
        </p>
      ) : (
        <p className="mt-6 border border-[#e5e5e5] px-4 py-3 text-sm text-[#737373]">
          Kunci belum terpasang. Aplikasi tetap jalan di laptop ini sampai langkah 4 selesai.
        </p>
      )}

      <ol className="mt-8 list-decimal space-y-4 pl-5 text-sm">
        <li>
          Buka{" "}
          <a href="https://supabase.com" className="underline" target="_blank" rel="noreferrer">
            supabase.com
          </a>
          , daftar, lalu New project. Tunggu sampai status Active.
        </li>
        <li>
          Di proyek itu: SQL Editor → New query. Salin seluruh isi file{" "}
          <code className="font-[family-name:var(--font-mono)] text-xs">supabase/schema.sql</code> di folder aplikasi ini, tempel, Run.
        </li>
        <li>
          Authentication → Providers → Email → matikan Confirm email. Tanpa ini, akun baru tidak langsung bisa masuk.
        </li>
        <li>
          Project Settings → API. Salin Project URL dan anon public key ke file{" "}
          <code className="font-[family-name:var(--font-mono)] text-xs">.env.local</code> di folder aplikasi, seperti{" "}
          <code className="font-[family-name:var(--font-mono)] text-xs">.env.example</code>. Restart{" "}
          <code className="font-[family-name:var(--font-mono)] text-xs">npm run dev</code>.
        </li>
        <li>
          Buka /daftar. Akun pertama jadi admin. Akun berikutnya jadi sales — ganti peran di tabel{" "}
          <code className="font-[family-name:var(--font-mono)] text-xs">profiles</code> (Table Editor) kalau perlu.
        </li>
      </ol>

      <p className="mt-8 text-xs text-[#737373]">
        Jangan kirim URL atau kunci ke chat. Cukup tempel di .env.local.
      </p>

      <p className="mt-6">
        <Link href="/" className="text-sm underline">
          Kembali kerja di laptop ini
        </Link>
      </p>
    </div>
  );
}
