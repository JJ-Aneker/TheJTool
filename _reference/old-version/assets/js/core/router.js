// ===============================
// core/router.js – router simple + guard de salida
// ===============================

(function () {
  const views = {};
  let currentView = null;

  // Hooks: si alguno devuelve false, se cancela la navegación
  const beforeLeaveHooks = [];

  function registerView(name, handler) {
    views[name] = handler;
  }

  function addBeforeLeaveHook(fn) {
    if (typeof fn === "function") beforeLeaveHooks.push(fn);
  }

  async function setView(name) {
    const nextView = views[name] ? name : "home";
    const prevView = currentView;

    // Guard: antes de cambiar de vista
    if (prevView && prevView !== nextView) {
      for (const hook of beforeLeaveHooks) {
        try {
          const ok = await hook({ from: prevView, to: nextView });
          if (ok === false) return; // cancelado
        } catch (e) {
          console.error("Error en beforeLeaveHook:", e);
          // si un hook falla, no bloqueamos
        }
      }
    }

    const fn = views[nextView] || views["home"];
    if (!fn) return;

    currentView = nextView;
    await fn();
  }

  window.Router = {
    registerView,
    setView,
    addBeforeLeaveHook,
    get currentView() {
      return currentView;
    }
  };
})();