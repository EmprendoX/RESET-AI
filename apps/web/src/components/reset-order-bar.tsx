// Barra global de RESET-ORDER dentro del coach (navegación cross-app + regreso al hub).
// Se renderiza en el servidor como HTML estático (sin depender de un archivo JS
// externo), por eso no puede fallar por un 404. Los estilos viven en reset-shell.css.
// "Master AI" queda activo porque esta app ES Master AI.

const RO = "https://resete-order.netlify.app";

type Tab = {
  label: string;
  href: string;
  icon: React.ReactNode;
  active?: boolean;
};

const tabs: Tab[] = [
  {
    label: "Inicio",
    href: `${RO}/inicio`,
    icon: (
      <path
        d="M3 11l9-7 9 7M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "Audios",
    href: `${RO}/binaural/#audios`,
    icon: (
      <path
        d="M4 14v-2a8 8 0 0 1 16 0v2M4 14a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2zm16 0a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "Cursos",
    href: `${RO}/edu/`,
    icon: (
      <>
        <path d="M2 9l10-5 10 5-10 5L2 9z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
        <path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M22 9v5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: "Master AI",
    href: "/",
    active: true,
    icon: (
      <>
        <path d="M12 3l1.6 3.4L17 8l-3.4 1.6L12 13l-1.6-3.4L7 8l3.4-1.6L12 3z" fill="currentColor" />
        <path d="M19 13l.9 1.9L22 16l-2.1.9L19 19l-.9-2.1L16 16l2.1-1.1L19 13z" fill="currentColor" />
        <path d="M6 16l.7 1.5L8 18l-1.3.6L6 20l-.7-1.4L4 18l1.3-.5L6 16z" fill="currentColor" />
      </>
    ),
  },
  {
    label: "Comunidad",
    href: `${RO}/hub`,
    icon: (
      <>
        <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <circle cx="17" cy="9" r="2.6" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="M3 19c0-3 3-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M15 19c0-2 2-3.5 4-3.5S21 17 21 19" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: "Ajustes",
    href: `${RO}/settings`,
    icon: (
      <>
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" strokeWidth="2" fill="none" />
        <path
          d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.7 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
      </>
    ),
  },
];

export function ResetOrderBar() {
  return (
    <div id="reset-shell-root">
      <header className="reset-topbar">
        <a className="reset-brand" href={`${RO}/inicio`} aria-label="Volver a RESET-ORDER">
          <b>
            THE RESET <span>ORDER</span>
          </b>
        </a>
        <nav className="reset-tabs" aria-label="Navegación RESET-ORDER">
          {tabs.map((t) => (
            <a
              key={t.label}
              className={`reset-tab${t.active ? " is-active" : ""}`}
              href={t.href}
              aria-current={t.active ? "page" : undefined}
            >
              <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
                {t.icon}
              </svg>
              <span>{t.label}</span>
            </a>
          ))}
        </nav>
      </header>
    </div>
  );
}
