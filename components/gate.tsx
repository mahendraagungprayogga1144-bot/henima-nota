"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ROLE_LABEL } from "@/lib/access";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { Button, Field, inputClass } from "./ui";

export function Gate({ children }: { children: React.ReactNode }) {
  const { ready, session, cloudEnabled, state, signIn } = useStore();
  const router = useRouter();
  const [role, setRole] = useState<Role>("sales");
  const [salesId, setSalesId] = useState(state.sales[0]?.id ?? "");
  const [leaderId, setLeaderId] = useState(state.leaders[0]?.id ?? "");
  const [name, setName] = useState("");

  useEffect(() => {
    if (cloudEnabled && !session) router.replace("/masuk");
  }, [cloudEnabled, session, router]);

  if (!ready) return <p className="p-8 text-sm text-[#737373]">Memuat…</p>;
  if (session) return children;
  if (cloudEnabled) {
    return <p className="p-8 text-sm text-[#737373]">Mengalihkan ke masuk…</p>;
  }

  function enter() {
    if (role === "sales") {
      const person = state.sales.find((s) => s.id === salesId);
      if (!person) return;
      signIn({ role, actorName: person.name, salesId: person.id, leaderId: person.leaderId });
      return;
    }
    if (role === "leader") {
      const leader = state.leaders.find((l) => l.id === leaderId);
      if (!leader) return;
      signIn({ role, actorName: leader.name, salesId: null, leaderId: leader.id });
      return;
    }
    const actorName = name.trim() || ROLE_LABEL[role];
    signIn({ role, actorName, salesId: null, leaderId: null });
  }

  const canEnter =
    role === "admin" || role === "gudang"
      ? true
      : role === "sales"
        ? Boolean(salesId && state.sales.length)
        : Boolean(leaderId && state.leaders.length);

  return (
    <div className="flex min-h-full items-center justify-center bg-white px-4 py-16">
      <div className="w-full max-w-md border border-[#e5e5e5] p-8">
        <p className="font-[family-name:var(--font-display)] text-3xl tracking-[0.18em] uppercase">Henima</p>
        <p className="mt-2 text-sm text-[#737373]">
          Masuk sesuai tugas. Sistem ini harus bisa jalan tanpa owner di sampingmu.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          {(["sales", "gudang", "leader", "admin"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRole(key)}
              className={`border px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider ${
                role === key ? "border-[#111111] bg-[#111111] text-white" : "border-[#e5e5e5] text-[#737373]"
              }`}
            >
              {ROLE_LABEL[key]}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {role === "sales" ? (
            state.sales.length === 0 ? (
              <p className="text-sm text-[#737373]">
                Belum ada sales. Masuk sebagai admin dulu, lalu isi di Tim Sales.
              </p>
            ) : (
            <Field label="Nama sales">
              <select className={inputClass} value={salesId} onChange={(e) => setSalesId(e.target.value)}>
                {state.sales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            )
          ) : null}
          {role === "leader" ? (
            state.leaders.length === 0 ? (
              <p className="text-sm text-[#737373]">
                Belum ada leader. Masuk sebagai admin dulu, lalu isi di Tim Sales.
              </p>
            ) : (
            <Field label="Nama leader">
              <select className={inputClass} value={leaderId} onChange={(e) => setLeaderId(e.target.value)}>
                {state.leaders.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
            )
          ) : null}
          {role === "admin" || role === "gudang" ? (
            <Field label="Nama kamu">
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === "admin" ? "mis. Mahendra" : "mis. Petugas gudang"}
              />
            </Field>
          ) : null}
        </div>

        <Button className="mt-6 w-full" onClick={enter} disabled={!canEnter}>
          Mulai kerja
        </Button>
        <p className="mt-4 text-center text-xs text-[#737373]">
          Data masih di laptop ini.{" "}
          <Link href="/setup" className="underline">
            Hubungkan server
          </Link>
        </p>
      </div>
    </div>
  );
}
