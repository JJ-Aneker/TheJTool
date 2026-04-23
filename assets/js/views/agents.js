// ===============================
// views/agents.js – AI Agents Module
// ===============================

(function () {
  async function renderAgents() {
    const html = `
      <section class="panel resultados" id="mainPanel" style="display: flex; flex-direction: column; padding: 0;">
        <div class="iframe-container" style="flex: 1; overflow: hidden;">
          <iframe
            src="agents_validator.html"
            class="iframe-embed"
            title="AI Agents - XML Validator"
            allowfullscreen
            style="width: 100%; height: 100%; border: none;">
          </iframe>
        </div>
      </section>
    `;
    UI.replaceWithAnimation(html);
  }

  Router.registerView("agents", renderAgents);
})();
