"use client";

import { useEffect, useState } from "react";

interface Generation {
  id: string;
  prompt: string;
  type: string;
  imageUrl: string | null;
  status: string;
  creditsUsed: number;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  generate: "✨",
  edit: "✏️",
  profile: "👤",
  banner: "📢",
  group: "👥",
};

const TYPE_LABELS: Record<string, string> = {
  generate: "Gerar",
  edit: "Editar",
  profile: "Perfil",
  banner: "Banner",
  group: "Grupo",
};

export default function HistoryPanel() {
  const [history, setHistory] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Generation | null>(null);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((d: { history?: Generation[] }) => {
        setHistory(d.history ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl shimmer" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🖼️</div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--text)" }}>
          Nenhuma imagem ainda
        </h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Gere sua primeira imagem para ver o histórico aqui
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((gen) => (
          <div
            key={gen.id}
            className="glow-card overflow-hidden cursor-pointer"
            onClick={() => gen.imageUrl && setSelected(gen)}
          >
            {gen.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={gen.imageUrl}
                alt={gen.prompt}
                className="w-full aspect-square object-cover"
                style={{ borderRadius: "20px 20px 0 0" }}
              />
            ) : (
              <div
                className="w-full aspect-square flex items-center justify-center"
                style={{
                  background: gen.status === "failed"
                    ? "rgba(255,60,60,0.05)"
                    : "rgba(0,212,255,0.05)",
                  borderRadius: "20px 20px 0 0",
                }}
              >
                <span className="text-4xl">
                  {gen.status === "failed" ? "❌" : "⏳"}
                </span>
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{TYPE_ICONS[gen.type] || "✨"}</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(0,212,255,0.1)",
                    color: "var(--cyan)",
                  }}
                >
                  {TYPE_LABELS[gen.type] || gen.type}
                </span>
                <span
                  className="text-xs ml-auto font-medium"
                  style={{
                    color:
                      gen.status === "completed"
                        ? "var(--green)"
                        : gen.status === "failed"
                        ? "#ff6b6b"
                        : "#ffb400",
                  }}
                >
                  {gen.status === "completed" ? "✓" : gen.status === "failed" ? "✗" : "..."}
                </span>
              </div>
              <p className="text-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>
                {gen.prompt}
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>
                {new Date(gen.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(20px)" }}
          onClick={() => setSelected(null)}
        >
          <div
            className="max-w-2xl w-full rounded-2xl overflow-hidden"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.imageUrl!} alt={selected.prompt} className="w-full" />
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>
                  {selected.prompt}
                </p>
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                  {new Date(selected.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <a
                  href={selected.imageUrl!}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary px-4 py-2 text-sm font-semibold inline-flex items-center gap-1 no-underline"
                  style={{ textDecoration: "none" }}
                >
                  ⬇ Baixar
                </a>
                <button
                  onClick={() => setSelected(null)}
                  className="btn-secondary px-4 py-2 text-sm font-semibold"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
