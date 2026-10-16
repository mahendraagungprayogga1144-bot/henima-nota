"use client";

import { useState } from "react";
import { Button, Field, PageTitle, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function TimPage() {
  const { state, addLeader, addSales } = useStore();
  const [leaderName, setLeaderName] = useState("");
  const [salesName, setSalesName] = useState("");
  const [salesLeader, setSalesLeader] = useState<string>("");
  const [error, setError] = useState("");

  return (
    <div>
      <PageTitle
        kicker="Organisasi"
        title="Tim sales"
        subtitle="Tambah leader dan sales. Nama ini yang muncul saat buat nota dan di kinerja."
      />

      {error ? <p className="mb-4 text-sm">{error}</p> : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="border border-[#e5e5e5] p-5">
          <h2 className="mb-4 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#737373]">
            Leader
          </h2>
          <div className="mb-4 space-y-2">
            {state.leaders.map((l) => {
              const count = state.sales.filter((s) => s.leaderId === l.id).length;
              return (
                <div key={l.id} className="flex justify-between border-b border-[#e5e5e5] py-2 text-sm">
                  <span>{l.name}</span>
                  <span className="text-[#737373]">{count} sales</span>
                </div>
              );
            })}
          </div>
          <Field label="Nama leader baru">
            <input className={inputClass} value={leaderName} onChange={(e) => setLeaderName(e.target.value)} />
          </Field>
          <Button
            className="mt-3"
            onClick={() => {
              setError("");
              try {
                addLeader(leaderName);
                setLeaderName("");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Gagal menambah leader");
              }
            }}
          >
            Tambah leader
          </Button>
        </section>

        <section className="border border-[#e5e5e5] p-5">
          <h2 className="mb-4 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#737373]">
            Sales
          </h2>
          <div className="mb-4 space-y-2">
            {state.sales.map((s) => {
              const leader = state.leaders.find((l) => l.id === s.leaderId);
              return (
                <div key={s.id} className="flex justify-between border-b border-[#e5e5e5] py-2 text-sm">
                  <span>{s.name}</span>
                  <span className="text-[#737373]">{leader?.name ?? "Counter / tanpa leader"}</span>
                </div>
              );
            })}
          </div>
          <div className="grid gap-3">
            <Field label="Nama sales baru">
              <input className={inputClass} value={salesName} onChange={(e) => setSalesName(e.target.value)} />
            </Field>
            <Field label="Leader">
              <select className={inputClass} value={salesLeader} onChange={(e) => setSalesLeader(e.target.value)}>
                <option value="">Counter / tanpa leader</option>
                {state.leaders.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Button
            className="mt-3"
            onClick={() => {
              setError("");
              try {
                addSales(salesName, salesLeader || null);
                setSalesName("");
                setSalesLeader("");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Gagal menambah sales");
              }
            }}
          >
            Tambah sales
          </Button>
        </section>
      </div>
    </div>
  );
}
