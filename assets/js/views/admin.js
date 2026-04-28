(function () {
  async function renderAdmin() {
    const profile = await getProfile();
    if (!profile || profile.role !== "admin") {
      Router.setView("home");
      return;
    }

    const html = `
      <section class="panel resultados" id="mainPanel" style="display: flex; flex-direction: column; padding: 0;">
        <div class="iframe-container" style="flex: 1; overflow: hidden;">
          <iframe
            src="admin.html"
            class="iframe-embed"
            title="Admin Panel"
            allowfullscreen
            style="width: 100%; height: 100%; border: none;">
          </iframe>
        </div>
      </section>
    `;
    UI.replaceWithAnimation(html);
  }

  Router.registerView("admin", renderAdmin);
})();
