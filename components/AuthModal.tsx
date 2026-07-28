"use client";

import { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
  isAdmin: boolean;
}

interface Props {
  mode: "login" | "register";
  onClose: () => void;
  onSuccess: (user: User) => void;
  onToggleMode: () => void;
}

export default function AuthModal({ mode, onClose, onSuccess, onToggleMode }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login" ? { email, password } : { name, email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json() as { error?: string; user?: User; userId?: string };

      if (!res.ok || data.error) {
        setError(data.error || "Erro ao processar");
        return;
      }

      // Fetch fresh user data
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json() as { user?: User };
      if (meData.user) {
        onSuccess(meData.user);
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md p-8 rounded-2xl animate-fade-in"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-4"
            style={{ background: "var(--gradient)", color: "#000" }}
          >
            P
          </div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--text)", letterSpacing: "-0.5px" }}>
            {mode === "login" ? "Bem-vindo de volta" : "Criar sua conta"}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {mode === "login"
              ? "Entre para acessar seu painel"
              : "Ganhe 50 créditos grátis ao se cadastrar"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                Seu nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como devemos te chamar?"
                className="w-full px-4 py-3 text-sm"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 text-sm"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div
              className="p-3 rounded-xl text-sm"
              style={{
                background: "rgba(255,60,60,0.1)",
                border: "1px solid rgba(255,60,60,0.3)",
                color: "#ff6b6b",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 text-sm font-bold mt-2"
          >
            {loading
              ? "Processando..."
              : mode === "login"
              ? "Entrar no Painel"
              : "Criar Conta Grátis"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {mode === "login" ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
            <button
              onClick={onToggleMode}
              className="font-semibold"
              style={{ color: "var(--cyan)" }}
            >
              {mode === "login" ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
