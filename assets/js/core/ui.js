// ===============================
// core/ui.js – helpers UI comunes (+ modal glass)
// ===============================

(function () {
  function initToggles() {
    // ----- LEFT SIDEBAR -----
    const leftBtn = document.getElementById("toggleSidebarBtn");
    const leftKey = "sidebarCollapsed";

    try {
      if (localStorage.getItem(leftKey) === "1") {
        document.body.classList.add("sidebar-collapsed");
      }
    } catch {}

    if (leftBtn) {
      leftBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        document.body.classList.toggle("sidebar-collapsed");
        try {
          localStorage.setItem(
            leftKey,
            document.body.classList.contains("sidebar-collapsed") ? "1" : "0"
          );
        } catch {}
      });
    }

    // ----- RIGHT PANEL -----
    const favPanel = document.getElementById("favoritesPanel");
    const favBtn = document.getElementById("toggleFavoritesBtn");
    const favKey = "favoritesCollapsed";
    const content = document.querySelector(".content");

    try {
      if (localStorage.getItem(favKey) === "1") {
        favPanel?.classList.add("collapsed");
        content?.classList.add("collapsed");
      }
    } catch {}

    if (favBtn) {
      favBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        favPanel?.classList.toggle("collapsed");
        content?.classList.toggle("collapsed");

        try {
          localStorage.setItem(
            favKey,
            favPanel?.classList.contains("collapsed") ? "1" : "0"
          );
        } catch {}
      });
    }
  }

  function updateActionPanel(html) {
    const panel = document.getElementById("actionPanel");
    if (!panel) return;

    if (!html || html.trim() === "") {
      panel.innerHTML = `
        <button class="action-card disabled" type="button" disabled>
          <span class="icon">ℹ️</span>
          <span class="action-text">No hay acciones disponibles</span>
        </button>
      `;
    } else {
      panel.innerHTML = html;
    }
  }

  function replaceWithAnimation(html) {
    const oldPanel = document.getElementById("mainPanel");
    if (!oldPanel) return;

    const temp = document.createElement("div");
    temp.innerHTML = html.trim();

    const newPanel = temp.firstElementChild;
    if (!newPanel) return;

    newPanel.classList.add("screen-transition");
    oldPanel.replaceWith(newPanel);

    void newPanel.offsetWidth;
    newPanel.classList.add("screen-transition-active");
  }

  // ===============================
  // Modal glass helpers
  // ===============================
  function ensureModalRoot() {
    let root = document.getElementById("ui-modal-root");
    if (root) return root;

    root = document.createElement("div");
    root.id = "ui-modal-root";
    document.body.appendChild(root);
    return root;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ===============================
  // Modal glass: confirm async (2 botones)
  // resolve(true)=OK, resolve(false)=Cancel
  // ===============================
  function confirm({
    title = "Confirmación",
    message = "¿Seguro que quieres continuar?",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    danger = false
  } = {}) {
    const root = ensureModalRoot();

    return new Promise((resolve) => {
      root.innerHTML = "";

      const overlay = document.createElement("div");
      overlay.className = "glass-modal-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");

      const modal = document.createElement("div");
      modal.className = "glass-modal";

      modal.innerHTML = `
        <div class="glass-modal-head">
          <div class="glass-modal-title">${escapeHtml(title)}</div>
          <button class="glass-modal-x" type="button" aria-label="Cerrar">✕</button>
        </div>

        <div class="glass-modal-body">
          <p class="glass-modal-msg">${escapeHtml(message)}</p>
        </div>

        <div class="glass-modal-actions">
          <button class="ghost-btn glass-modal-cancel" type="button">${escapeHtml(cancelText)}</button>
          <button class="cta glass-modal-ok ${danger ? "danger" : ""}" type="button">${escapeHtml(confirmText)}</button>
        </div>
      `;

      overlay.appendChild(modal);
      root.appendChild(overlay);

      const btnCancel = modal.querySelector(".glass-modal-cancel");
      const btnOk = modal.querySelector(".glass-modal-ok");
      const btnX = modal.querySelector(".glass-modal-x");

      const cleanup = () => {
        root.innerHTML = "";
        document.removeEventListener("keydown", onKeyDown, true);
      };

      const close = (result) => {
        cleanup();
        resolve(result);
      };

      const onKeyDown = (e) => {
        if (e.key === "Escape") close(false);
        if (e.key === "Enter") close(true);
      };

      document.addEventListener("keydown", onKeyDown, true);

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close(false);
      });

      btnCancel?.addEventListener("click", () => close(false));
      btnOk?.addEventListener("click", () => close(true));
      btnX?.addEventListener("click", () => close(false));

      setTimeout(() => {
        (danger ? btnCancel : btnOk)?.focus?.();
      }, 0);
    });
  }

  // ===============================
  // Modal glass: prompt3 async (3 acciones)
  // resolve("primary" | "secondary" | "tertiary")
  // ===============================
  function prompt3({
    title = "Confirmación",
    message = "",
    primaryText = "Aceptar",
    secondaryText = "Cancelar",
    tertiaryText = "",
    dangerPrimary = false,
    dangerTertiary = false
  } = {}) {
    const root = ensureModalRoot();

    return new Promise((resolve) => {
      root.innerHTML = "";

      const overlay = document.createElement("div");
      overlay.className = "glass-modal-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");

      const modal = document.createElement("div");
      modal.className = "glass-modal";

      modal.innerHTML = `
        <div class="glass-modal-head">
          <div class="glass-modal-title">${escapeHtml(title)}</div>
          <button class="glass-modal-x" type="button" aria-label="Cerrar">✕</button>
          
        </div>

        <div class="glass-modal-body">
          <p class="glass-modal-msg">${escapeHtml(message)}</p>
        </div>

        <div class="glass-modal-actions glass-modal-actions--3">
          ${tertiaryText ? `<button class="cta glass-modal-tertiary ${dangerTertiary ? "danger" : ""}" type="button">${escapeHtml(tertiaryText)}</button>` : ""}
          <div class="glass-modal-actions-right">
            <button class="ghost-btn glass-modal-secondary" type="button">${escapeHtml(secondaryText)}</button>
            
            <button class="cta glass-modal-primary ${dangerPrimary ? "danger" : ""}" type="button">${escapeHtml(primaryText)}</button>
          </div>
        </div>
      `;

      overlay.appendChild(modal);
      root.appendChild(overlay);

      const btnPrimary = modal.querySelector(".glass-modal-primary");
      const btnSecondary = modal.querySelector(".glass-modal-secondary");
      const btnTertiary = modal.querySelector(".glass-modal-tertiary");
      const btnX = modal.querySelector(".glass-modal-x");

      const cleanup = () => {
        root.innerHTML = "";
        document.removeEventListener("keydown", onKeyDown, true);
      };

      const close = (result) => {
        cleanup();
        resolve(result);
      };

      const onKeyDown = (e) => {
        if (e.key === "Escape") close("secondary");
        if (e.key === "Enter") close("primary");
      };

      document.addEventListener("keydown", onKeyDown, true);

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close("secondary");
      });

      btnSecondary?.addEventListener("click", () => close("secondary"));
      btnPrimary?.addEventListener("click", () => close("primary"));
      btnTertiary?.addEventListener("click", () => close("tertiary"));
      btnX?.addEventListener("click", () => close("secondary"));

      setTimeout(() => btnSecondary?.focus?.(), 0);
    });
  }

  // Exponer
  window.UI = {
    initToggles,
    updateActionPanel,
    replaceWithAnimation,
    confirm,
    prompt3
  };
})();