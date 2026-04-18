(function () {
  async function renderWS() {
    // Aquí delegamos en tu ws.js actual si existe
    if (typeof loadWebServiceList === "function") {
      loadWebServiceList();
      return;
    }

    const html = `
      <section class="panel resultados" id="mainPanel">
        <div class="page-header">
          <div class="page-header-content">
            <h2>Therefore™ Dynamic View</h2>
            <p>Accede a instancias de Therefore en línea.</p>
          </div>
        </div>
        <p style="margin-top:14px; color: var(--muted);">
          No se ha encontrado <code>loadWebServiceList()</code>. Revisa que <strong>ws.js</strong> esté cargado.
        </p>
      </section>
    `;
    UI.replaceWithAnimation(html);
    UI.updateActionPanel("");
  }

  Router.registerView("ws", renderWS);
})();