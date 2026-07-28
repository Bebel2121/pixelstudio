"use client";

import { useState } from "react";
import GeneratorPanel from "@/components/GeneratorPanel";
import HistoryPanel from "@/components/HistoryPanel";

interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
  isAdmin: boolean;
}

interface Props {
  user: User;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
}

type Tab = "generate" | "history";

export default function Dashboard({ user, onLogout, onUserUpdate }: Props) {
  const [tab, setTab] = useState<Tab>("generate");
  const [credits, setCredits] = useState(user.credits);

  const updateCredits = (newCredits: number) => {
    setCredits(newCredits);
    onUserUpdate({ ...user, credits: newCredits });
  };

  const tabs = [
    { id: "generate" as Tab, label: "Gerar Imagem", icon: "✨" },
    { id: "history" as Tab, label: "Histórico", icon: "🕓" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-3"
        style={{
          background: "rgba(5,5,5,0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: "var(--gradient)", color: "#000" }}
          >
            P
          </div>
          <span className="font-bold tracking-tight">
            <span className="gradient-text">Pixel</span>
            <span style={{ color: "var(--text)" }}>Studio</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Credits badge */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
            style={{
              background: credits > 20
                ? "rgba(0,255,136,0.1)"
                : credits > 0
                ? "rgba(255,180,0,0.1)"
                : "rgba(255,60,60,0.1)",
              border: `1px solid ${credits > 20 ? "rgba(0,255,136,0.3)" : credits > 0 ? "rgba(255,180,0,0.3)" : "rgba(255,60,60,0.3)"}`,
              color: credits > 20 ? "var(--green)" : credits > 0 ? "#ffb400" : "#ff6b6b",
            }}
          >
            <span translate="no">⚡</span>
            <span translate="no">{credits}</span>
            <span>créditos</span>
          </div>

          {/* User name */}
          <span className="text-sm font-medium hidden sm:block" style={{ color: "var(--text-muted)" }}>
            {user.name}
          </span>

          <button
            onClick={onLogout}
            className="btn-secondary px-4 py-2 text-xs font-semibold"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Low credits banner */}
      {credits <= 10 && credits > 0 && (
        <div
          className="px-6 py-3 text-sm text-center font-medium"
          style={{
            background: "rgba(255,180,0,0.08)",
            borderBottom: "1px solid rgba(255,180,0,0.2)",
            color: "#ffb400",
          }}
        >
          ⚠️ Seus créditos estão acabando! Entre em contato com o dono do painel para comprar mais.
        </div>
      )}
      {credits === 0 && (
        <div
          className="px-6 py-3 text-sm text-center font-medium"
          style={{
            background: "rgba(255,60,60,0.08)",
            borderBottom: "1px solid rgba(255,60,60,0.2)",
            color: "#ff6b6b",
          }}
        >
          ❌ Créditos zerados! Entre em contato com o dono do painel para recarregar.
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-2xl mb-8 w-fit"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={
                tab === t.id
                  ? {
                      background: "var(--gradient)",
                      color: "#000",
                    }
                  : {
                      color: "var(--text-muted)",
                      background: "transparent",
                    }
              }
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "generate" && (
          <GeneratorPanel
            credits={credits}
            onCreditsUpdate={updateCredits}
          />
        )}
        {tab === "history" && <HistoryPanel />}
      </div>
    </div>
  );
}
