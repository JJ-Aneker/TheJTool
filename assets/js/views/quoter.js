// ===============================
// views/quoter.js – Therefore™ Quoter Module
// ===============================

(function () {
  async function renderQuoter() {
    const html = `
      <section class="panel resultados" id="mainPanel" style="display: flex; flex-direction: column; padding: 0;">
        <div class="iframe-container" style="flex: 1; overflow: hidden;">
          <iframe
            src="http://localhost:3000"
            class="iframe-embed"
            title="Therefore™ Quoter"
            allowfullscreen
            style="width: 100%; height: 100%; border: none;">
          </iframe>
        </div>
      </section>
    `;
    UI.replaceWithAnimation(html);
  }

  Router.registerView("quoter", renderQuoter);
})();
