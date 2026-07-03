/*
 * THE RESETE ORDER — Barra global (versión coach / RESET-AI)
 * Renderiza la barra superior con navegación de vuelta a RESET-ORDER.
 * Como esta app vive en otro dominio (reset-ai.netlify.app), los enlaces
 * usan URLs absolutas a https://resete-order.netlify.app.
 * "Master AI" queda marcado como activo (es esta app).
 */
(function () {
  "use strict";

  var RO = "https://resete-order.netlify.app";

  var TABS = [
    {
      label: "Inicio",
      href: RO + "/inicio",
      svg: '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M3 11l9-7 9 7M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    },
    {
      label: "Audios",
      href: RO + "/binaural/#audios",
      svg: '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2zm16 0a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/></svg>',
    },
    {
      label: "Cursos",
      href: RO + "/edu/",
      svg: '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M2 9l10-5 10 5-10 5L2 9z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M22 9v5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
    },
    {
      label: "Master AI",
      href: "/",
      active: true,
      svg: '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M12 3l1.6 3.4L17 8l-3.4 1.6L12 13l-1.6-3.4L7 8l3.4-1.6L12 3z" fill="currentColor"/><path d="M19 13l.9 1.9L22 16l-2.1.9L19 19l-.9-2.1L16 16l2.1-1.1L19 13z" fill="currentColor"/><path d="M6 16l.7 1.5L8 18l-1.3.6L6 20l-.7-1.4L4 18l1.3-.5L6 16z" fill="currentColor"/></svg>',
    },
    {
      label: "Comunidad",
      href: RO + "/hub",
      svg: '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><circle cx="9" cy="8" r="3.2" stroke="currentColor" stroke-width="1.8" fill="none"/><circle cx="17" cy="9" r="2.6" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M15 19c0-2 2-3.5 4-3.5S21 17 21 19" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
    },
    {
      label: "Ajustes",
      href: RO + "/settings",
      svg: '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" stroke-width="2" fill="none"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.7 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    },
  ];

  function render() {
    var root = document.getElementById("reset-shell-root");
    if (!root) return;

    var html =
      '<div class="reset-topbar">' +
      '<a class="reset-brand" href="' +
      RO +
      '/inicio" aria-label="Volver a RESET-ORDER">' +
      '<img src="' +
      RO +
      '/shell/logo.png" alt="" aria-hidden="true" />' +
      "<b>THE RESET <span>ORDER</span></b>" +
      "</a>" +
      '<nav class="reset-tabs" aria-label="Navegación RESET-ORDER">';

    for (var i = 0; i < TABS.length; i++) {
      var t = TABS[i];
      html +=
        '<a class="reset-tab' +
        (t.active ? " is-active" : "") +
        '" href="' +
        t.href +
        '"' +
        (t.active ? ' aria-current="page"' : "") +
        ">" +
        t.svg +
        "<span>" +
        t.label +
        "</span></a>";
    }

    html += "</nav></div>";
    root.innerHTML = html;

    if (document.body && !document.body.classList.contains("reset-shell-toppad")) {
      document.body.classList.add("reset-shell-toppad");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
