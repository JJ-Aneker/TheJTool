// ===============================
// views/doc_generator.js – Document Generator Module
// ===============================

(function () {
  async function renderDocGenerator() {
    const html = `
      <section class="panel resultados" id="mainPanel" style="display: flex; flex-direction: column; padding: 0;">
        <div class="iframe-container" style="flex: 1; overflow: hidden;">
          <iframe
            src="doc_generator.html"
            class="iframe-embed"
            title="Document Generator"
            allowfullscreen
            style="width: 100%; height: 100%; border: none;">
          </iframe>
        </div>
      </section>
    `;
    UI.replaceWithAnimation(html);
  }

  Router.registerView("docGenerator", renderDocGenerator);
})();
