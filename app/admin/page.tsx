"use client";

import { useEffect, useState } from "react";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  credits: number;
  isAdmin: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditSuccess, setCreditSuccess] = useState("");
  const [creditError, setCreditError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Check if already admin
    fetch("/api/admin/users")
      .then((r) => {
        if (r.ok) {
          setAuthenticated(true);
          loadUsers();
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.success) {
        setAuthenticated(true);
        loadUsers();
      } else {
        setLoginError(data.error || "Senha incorreta");
      }
    } catch {
      setLoginError("Erro de conexão");
    } finally {
      setLoginLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json() as { users?: UserRecord[] };
      setUsers(data.users ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async () => {
    if (!selectedUser || !creditAmount) return;
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) { setCreditError("Quantidade inválida"); return; }

    setCreditLoading(true);
    setCreditError("");
    setCreditSuccess("");

    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount,
          reason: creditReason || "Créditos adicionados pelo admin",
        }),
      });
      const data = await res.json() as { success?: boolean; credits?: number; error?: string };
      if (data.success) {
        setCreditSuccess(`✅ ${amount} créditos adicionados! Total: ${data.credits}`);
        setCreditAmount("");
        setCreditReason("");
        // Update user in list
        setUsers((prev) =>
          prev.map((u) => u.id === selectedUser.id ? { ...u, credits: data.credits! } : u)
        );
        setSelectedUser((prev) => prev ? { ...prev, credits: data.credits! } : null);
        await loadUsers();
      } else {
        setCreditError(data.error || "Erro ao adicionar créditos");
      }
    } catch {
      setCreditError("Erro de conexão");
    } finally {
      setCreditLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Login screen
  if (!authenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="w-full max-w-sm p-8 rounded-2xl"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
          }}
        >
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
              style={{ background: "rgba(255,0,80,0.15)", border: "1px solid rgba(255,0,80,0.3)" }}
            >
              🔐
            </div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text)", letterSpacing: "-0.5px" }}>
              Área do Administrador
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Acesso restrito ao dono do painel
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase mb-2" style={{ color: "var(--text-dim)", letterSpacing: "0.08em" }}>
                Senha de Administrador
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 text-sm"
                required
                autoFocus
              />
            </div>

            {loginError && (
              <div
                className="p-3 rounded-xl text-sm"
                style={{ background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,60,60,0.3)", color: "#ff6b6b" }}
              >
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 text-sm font-bold rounded-full transition-all duration-150 text-white"
              style={{
                background: loginLoading ? "rgba(255,0,80,0.3)" : "linear-gradient(135deg, #ff0050, #ff6b35)",
                cursor: loginLoading ? "not-allowed" : "pointer",
              }}
            >
              {loginLoading ? "Verificando..." : "Entrar como Admin"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-sm" style={{ color: "var(--text-dim)" }}>
              ← Voltar ao painel
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
        style={{
          background: "rgba(5,5,5,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,0,80,0.2)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: "linear-gradient(135deg,#ff0050,#ff6b35)" }}
          >
            👑
          </div>
          <div>
            <h1 className="font-bold text-sm" style={{ color: "var(--text)" }}>
              Painel do Administrador
            </h1>
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>
              PixelStudio Admin
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: "rgba(255,0,80,0.15)", color: "#ff4466", border: "1px solid rgba(255,0,80,0.3)" }}
          >
            ∞ Créditos Ilimitados
          </span>
          <button onClick={handleLogout} className="btn-secondary px-4 py-2 text-xs">
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total de Usuários", value: users.length, icon: "👥", color: "var(--cyan)" },
            { label: "Créditos Distribuídos", value: users.reduce((s, u) => s + u.credits, 0), icon: "⚡", color: "var(--green)" },
            { label: "Usuários Ativos", value: users.filter((u) => u.credits > 0).length, icon: "✅", color: "#ffb400" },
            { label: "Sem Créditos", value: users.filter((u) => u.credits === 0).length, icon: "❌", color: "#ff6b6b" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glow-card p-5"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold" style={{ color: stat.color }} translate="no">
                {stat.value}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users list */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg" style={{ color: "var(--text)" }}>
                Usuários Cadastrados
              </h2>
              <button
                onClick={loadUsers}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                🔄 Atualizar
              </button>
            </div>

            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="w-full px-4 py-2.5 text-sm mb-4"
            />

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-2xl shimmer" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                <div className="text-4xl mb-3">👤</div>
                <p>Nenhum usuário encontrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl cursor-pointer transition-all duration-200 flex items-center justify-between"
                    style={{
                      background: selectedUser?.id === u.id ? "rgba(0,212,255,0.08)" : "var(--card)",
                      border: selectedUser?.id === u.id
                        ? "1px solid rgba(0,212,255,0.4)"
                        : "1px solid var(--border)",
                    }}
                    onClick={() => {
                      setSelectedUser(u);
                      setCreditSuccess("");
                      setCreditError("");
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{
                          background: "rgba(0,212,255,0.1)",
                          color: "var(--cyan)",
                          border: "1px solid rgba(0,212,255,0.2)",
                        }}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                          {u.name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                          {u.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-sm font-bold"
                        style={{
                          color: u.credits > 20 ? "var(--green)" : u.credits > 0 ? "#ffb400" : "#ff6b6b",
                        }}
                        translate="no"
                      >
                        ⚡ {u.credits}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-dim)" }}>
                        créditos
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add credits panel */}
          <div>
            <h2 className="font-bold text-lg mb-4" style={{ color: "var(--text)" }}>
              Adicionar Créditos
            </h2>

            {!selectedUser ? (
              <div
                className="glow-card p-6 text-center"
                style={{ color: "var(--text-muted)" }}
              >
                <div className="text-4xl mb-3">👈</div>
                <p className="text-sm">Selecione um usuário na lista para adicionar créditos</p>
              </div>
            ) : (
              <div className="glow-card p-6 space-y-4">
                {/* Selected user */}
                <div
                  className="p-3 rounded-xl flex items-center gap-3"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                    style={{ background: "rgba(0,212,255,0.1)", color: "var(--cyan)" }}
                  >
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {selectedUser.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                      Créditos atuais:{" "}
                      <span style={{ color: "var(--green)" }} translate="no">
                        {selectedUser.credits}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Quick amounts */}
                <div>
                  <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--text-dim)", letterSpacing: "0.08em" }}>
                    Pacotes rápidos
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[50, 100, 200, 300, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setCreditAmount(String(amt))}
                        className="py-2 rounded-xl text-xs font-bold transition-all"
                        style={{
                          background:
                            creditAmount === String(amt)
                              ? "rgba(0,212,255,0.15)"
                              : "var(--surface)",
                          border:
                            creditAmount === String(amt)
                              ? "1px solid var(--cyan)"
                              : "1px solid var(--border)",
                          color:
                            creditAmount === String(amt) ? "var(--cyan)" : "var(--text-muted)",
                        }}
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "var(--text-dim)", letterSpacing: "0.08em" }}>
                    Quantidade personalizada
                  </label>
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="Ex: 150"
                    className="w-full px-4 py-2.5 text-sm"
                    min={1}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "var(--text-dim)", letterSpacing: "0.08em" }}>
                    Motivo (opcional)
                  </label>
                  <input
                    type="text"
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    placeholder="Ex: Compra via Pix"
                    className="w-full px-4 py-2.5 text-sm"
                  />
                </div>

                {creditError && (
                  <div
                    className="p-3 rounded-xl text-sm"
                    style={{ background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,60,60,0.3)", color: "#ff6b6b" }}
                  >
                    {creditError}
                  </div>
                )}

                {creditSuccess && (
                  <div
                    className="p-3 rounded-xl text-sm"
                    style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", color: "var(--green)" }}
                  >
                    {creditSuccess}
                  </div>
                )}

                <button
                  onClick={handleAddCredits}
                  disabled={creditLoading || !creditAmount}
                  className="w-full py-3.5 text-sm font-bold rounded-full transition-all text-white"
                  style={{
                    background:
                      creditLoading || !creditAmount
                        ? "rgba(255,100,0,0.3)"
                        : "linear-gradient(135deg, #ff6b35, #ff0050)",
                    cursor: creditLoading || !creditAmount ? "not-allowed" : "pointer",
                  }}
                >
                  {creditLoading ? "Adicionando..." : `⚡ Adicionar ${creditAmount || "?"} Créditos`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
