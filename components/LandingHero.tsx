"use client";

interface Props {
  onLogin: () => void;
  onRegister: () => void;
}

export default function LandingHero({ onLogin, onRegister }: Props) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg)" }}
    >
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-8 py-4 sticky top-0 z-40"
        style={{
          background: "rgba(5,5,5,0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{ background: "var(--gradient)", color: "#000" }}
          >
            P
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="gradient-text">Pixel</span>
            <span style={{ color: "var(--text)" }}>Studio</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onLogin}
            className="btn-secondary px-5 py-2 text-sm font-semibold"
          >
            Entrar
          </button>
          <button
            onClick={onRegister}
            className="btn-primary px-5 py-2 text-sm font-semibold"
          >
            Criar Conta
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8"
          style={{
            background: "rgba(0,212,255,0.1)",
            border: "1px solid rgba(0,212,255,0.3)",
            color: "var(--cyan)",
            letterSpacing: "0.05em",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "var(--green)" }}
          />
          IA GERADORA DE IMAGENS
        </div>

        <h1
          className="font-bold mb-6 leading-tight"
          style={{
            fontSize: "clamp(2.5rem, 7vw, 5rem)",
            letterSpacing: "-2px",
            maxWidth: 800,
          }}
        >
          Crie imagens{" "}
          <span className="gradient-text">incríveis</span>
          <br />
          com inteligência artificial
        </h1>

        <p
          className="text-lg mb-12 max-w-xl leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          Gere fotos personalizadas, avatares de perfil, banners de anúncio,
          fotos de grupo e muito mais — tudo com IA de última geração.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onRegister}
            className="btn-primary px-8 py-4 text-base font-bold"
          >
            Começar Grátis →
          </button>
          <button
            onClick={onLogin}
            className="btn-secondary px-8 py-4 text-base font-semibold"
          >
            Já tenho conta
          </button>
        </div>

        <p
          className="mt-5 text-sm"
          style={{ color: "var(--text-dim)" }}
        >
          50 créditos grátis ao se cadastrar · Sem cartão necessário
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-3xl w-full">
          {[
            { icon: "🎨", label: "Gerar Imagem", desc: "Crie do zero" },
            { icon: "✏️", label: "Editar Foto", desc: "Modifique imagens" },
            { icon: "👤", label: "Foto de Perfil", desc: "Avatar perfeito" },
            { icon: "📢", label: "Banner", desc: "Anúncio profissional" },
          ].map((f) => (
            <div
              key={f.label}
              className="glow-card p-5 flex flex-col items-center gap-2 text-center cursor-pointer"
              onClick={onRegister}
            >
              <span className="text-3xl">{f.icon}</span>
              <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                {f.label}
              </span>
              <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                {f.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer
        className="text-center py-6 text-xs"
        style={{ color: "var(--text-dim)", borderTop: "1px solid var(--border)" }}
      >
        © 2025 PixelStudio · Powered by IA
      </footer>
    </div>
  );
}
