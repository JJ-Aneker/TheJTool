// ===============================
// views/docai_processor.js – DocAI Processor
// ===============================

(function () {
  async function renderDocAIProcessor() {
    const html = `
      <section class="panel resultados" id="mainPanel" style="display: flex; flex-direction: column; padding: 0;">
        <div class="iframe-container" style="flex: 1; overflow: hidden;">
          <iframe
            src="docai_processor.html"
            class="iframe-embed"
            title="DocAI Processor"
            allowfullscreen
            style="width: 100%; height: 100%; border: none;">
          </iframe>
        </div>
      </section>
    `;
    UI.replaceWithAnimation(html);
  }

  Router.registerView("docai_processor", renderDocAIProcessor);
})();
