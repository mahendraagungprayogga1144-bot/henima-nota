"use client";

import { useState } from "react";
import { Button, EmptyState, Field, PageTitle, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function TimPage() {
  const { state, addLeader, updateLeader, removeLeader, addSales, updateSales, removeSales } = useStore();
  const [leaderName, setLeaderName] = useState("");
  const [salesName, setSalesName] = useState("");
  const [salesLeader, setSalesLeader] = useState<string>("");
  const [editLeaderId, setEditLeaderId] = useState<string | null>(null);
  const [editLeaderName, setEditLeaderName] = useState("");
  const [editSalesId, setEditSalesId] = useState<string | null>(null);
  const [editSalesName, setEditSalesName] = useState("");
  const [editSalesLeader, setEditSalesLeader] = useState("");
  const [error, setError] = useState("");

  function run(action: () => void) {
    setError("");
    try {
      action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    }
  }

  return (
    <div>
      <PageTitle
        kicker="Organisasi"
        title="Tim sales"
        subtitle="Isi nama orang Henima yang sebenarnya. Nama ini yang muncul di nota dan kinerja."
      />

      {error ? <p className="mb-4 text-sm">{error}</p> : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="border border-[#e5e5e5] p-5">
          <h2 className="mb-4 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#737373]">
            Leader
          </h2>
          {state.leaders.length === 0 ? (
            <EmptyState title="Belum ada leader" body="Tambah leader tim, atau biarkan sales tanpa leader (counter)." />
          ) : (
            <div className="mb-4 space-y-2">
              {state.leaders.map((l) => {
                const count = state.sales.filter((s) => s.leaderId === l.id).length;
                if (editLeaderId === l.id) {
                  return (
                    <div key={l.id} className="space-y-2 border-b border-[#e5e5e5] py-2">
                      <input
                        className={inputClass}
                        value={editLeaderName}
                        onChange={(e) => setEditLeaderName(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            run(() => {
                              updateLeader(l.id, editLeaderName);
                              setEditLeaderId(null);
                            })
                          }
                        >
                          Simpan
                        </Button>
                        <Button variant="ghost" onClick={() => setEditLeaderId(null)}>
                          Batal
                        </Button>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={l.id} className="flex items-center justify-between gap-3 border-b border-[#e5e5e5] py-2 text-sm">
                    <div>
                      <p>{l.name}</p>
                      <p className="text-xs text-[#737373]">{count} sales</p>
                    </div>
                    <div className="flex gap-3 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider">
                      <button
                        className="text-[#737373] hover:text-[#111111]"
                        onClick={() => {
                          setEditLeaderId(l.id);
                          setEditLeaderName(l.name);
                        }}
                      >
                        Ubah
                      </button>
                      <button className="text-[#737373] hover:text-[#111111]" onClick={() => run(() => removeLeader(l.id))}>
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Field label="Nama leader baru">
            <input className={inputClass} value={leaderName} onChange={(e) => setLeaderName(e.target.value)} placeholder="Nama lengkap" />
          </Field>
          <Button
            className="mt-3"
            onClick={() =>
              run(() => {
                addLeader(leaderName);
                setLeaderName("");
              })
            }
          >
            Tambah leader
          </Button>
        </section>

        <section className="border border-[#e5e5e5] p-5">
          <h2 className="mb-4 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#737373]">
            Sales
          </h2>
          {state.sales.length === 0 ? (
            <EmptyState title="Belum ada sales" body="Tambah sales atau counter sebelum membuat nota." />
          ) : (
            <div className="mb-4 space-y-2">
              {state.sales.map((s) => {
                const leader = state.leaders.find((l) => l.id === s.leaderId);
                if (editSalesId === s.id) {
                  return (
                    <div key={s.id} className="space-y-2 border-b border-[#e5e5e5] py-2">
                      <input
                        className={inputClass}
                        value={editSalesName}
                        onChange={(e) => setEditSalesName(e.target.value)}
                      />
                      <select className={inputClass} value={editSalesLeader} onChange={(e) => setEditSalesLeader(e.target.value)}>
                        <option value="">Counter / tanpa leader</option>
                        {state.leaders.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            run(() => {
                              updateSales(s.id, editSalesName, editSalesLeader || null);
                              setEditSalesId(null);
                            })
                          }
                        >
                          Simpan
                        </Button>
                        <Button variant="ghost" onClick={() => setEditSalesId(null)}>
                          Batal
                        </Button>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={s.id} className="flex items-center justify-between gap-3 border-b border-[#e5e5e5] py-2 text-sm">
                    <div>
                      <p>{s.name}</p>
                      <p className="text-xs text-[#737373]">{leader?.name ?? "Counter / tanpa leader"}</p>
                    </div>
                    <div className="flex gap-3 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider">
                      <button
                        className="text-[#737373] hover:text-[#111111]"
                        onClick={() => {
                          setEditSalesId(s.id);
                          setEditSalesName(s.name);
                          setEditSalesLeader(s.leaderId ?? "");
                        }}
                      >
                        Ubah
                      </button>
                      <button className="text-[#737373] hover:text-[#111111]" onClick={() => run(() => removeSales(s.id))}>
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="grid gap-3">
            <Field label="Nama sales baru">
              <input className={inputClass} value={salesName} onChange={(e) => setSalesName(e.target.value)} placeholder="Nama lengkap" />
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
            onClick={() =>
              run(() => {
                addSales(salesName, salesLeader || null);
                setSalesName("");
                setSalesLeader("");
              })
            }
          >
            Tambah sales
          </Button>
        </section>
      </div>
    </div>
  );
}
