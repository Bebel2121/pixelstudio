"use client";

import { useEffect, useState } from "react";
import AuthModal from "@/components/AuthModal";
import Dashboard from "@/components/Dashboard";
import LandingHero from "@/components/LandingHero";

interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
  isAdmin: boolean;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-2 border-transparent animate-spin"
            style={{
              borderTopColor: "var(--cyan)",
              borderRightColor: "var(--green)",
            }}
          />
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} onUserUpdate={setUser} />;
  }

  return (
    <>
      <LandingHero
        onLogin={() => { setAuthMode("login"); setShowAuth(true); }}
        onRegister={() => { setAuthMode("register"); setShowAuth(true); }}
      />
      {showAuth && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuth(false)}
          onSuccess={(u) => { setUser(u); setShowAuth(false); }}
          onToggleMode={() => setAuthMode(authMode === "login" ? "register" : "login")}
        />
      )}
    </>
  );
}
