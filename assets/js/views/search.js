(function () {
  async function renderSearch() {
    const html = `
      <section class="panel resultados" id="mainPanel" style="display: flex; flex-direction: column; padding: 0;">
        <div class="iframe-container" style="flex: 1; overflow: hidden;">
          <iframe
            src="search.html"
            class="iframe-embed"
            title="Búsqueda"
            allowfullscreen
            style="width: 100%; height: 100%; border: none;">
          </iframe>
        </div>
      </section>
    `;
    UI.replaceWithAnimation(html);
  }

  Router.registerView("search", renderSearch);
})();