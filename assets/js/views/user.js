(function () {

  // Estado global sencillo para este módulo
  window.__profileDirty = false;

  // Guard de salida: bloquea si sales de la vista user con cambios
  if (window.Router && typeof Router.addBeforeLeaveHook === "function") {
    Router.addBeforeLeaveHook(async ({ from, to }) => {
      if (from !== "user") return true;
      if (to === "user") return true;
      if (!window.__profileDirty) return true;

      const choice = await UI.prompt3({
        title: "Cambios sin guardar",
        message: "Tienes cambios sin guardar. ¿Qué quieres hacer?",
        primaryText: "Guardar y salir",
        secondaryText: "Volver",
        tertiaryText: "Salir sin guardar",
        dangerTertiary: true
      });

      // Volver
      if (choice === "secondary") return false;

      // Salir sin guardar
      if (choice === "tertiary") return true;

      // Guardar y salir
      if (choice === "primary") {
        try {
          const ok = await window.__saveProfileSilent?.();
          return ok === true;
        } catch (e) {
          console.error("Error guardando perfil:", e);
          return false;
        }
      }

      return false;
    });
  }

  // Bloqueo también al recargar/cerrar pestaña (nativo del navegador)
  window.addEventListener("beforeunload", (e) => {
    if (!window.__profileDirty) return;
    e.preventDefault();
    e.returnValue = "";
  });

  async function renderUser() {
    const html = `
  <section class="panel resultados user-profile" id="mainPanel">

    <div class="page-header">
      <div class="page-header-content">
        <h2>Perfil de usuario</h2>
        <p>Actualiza tus datos personales y tu foto de perfil.</p>
      </div>

      <button class="ghost-btn back-btn" type="button">← Volver</button>
    </div>

    <div class="profile-grid">

      <!-- COLUMNA IZQUIERDA -->
      <aside class="profile-card profile-card--avatar">
        <div class="avatar-block avatar-block--centered">
          <img id="profile-avatar" src="avatar.png" class="avatar avatar--xl" alt="Avatar">

          <input type="file" id="avatar-file" accept="image/*" style="display:none">

          <button id="avatar-upload-btn" type="button" class="cta profile-action-btn">
            Cambiar foto
          </button>

          <!-- Guardar enlazado al form de la derecha -->
          <button type="submit" form="profile-form" class="cta profile-action-btn save-btn" disabled>
            Guardar cambios
          </button>

          <button id="logout-btn" type="button" class="cta profile-action-btn dangerLink">
            Cerrar sesión
          </button>

          <div class="profile-updated-info">
            Última actualización:
            <span id="profile-updated">—</span>
          </div>
        </div>
      </aside>

      <!-- COLUMNA DERECHA -->
      <section class="profile-card profile-card--form profile-card--full">

        <form id="profile-form" class="profile-form pro-form">

          <!-- Sub-tarjeta: Datos personales -->
          <div class="form-section">
            <div class="section-head">
              <h3 class="section-title">Datos personales</h3>
              <p class="section-desc">Información básica del usuario.</p>
            </div>

            <div class="fields-grid">
              <div class="field">
                <label for="profile-name" class="actions-label">Nombre</label>
                <input id="profile-name" class="input-glass" type="text" autocomplete="given-name" placeholder="Tu nombre">
              </div>

              <div class="field">
                <label for="profile-surname" class="actions-label">Apellidos</label>
                <input id="profile-surname" class="input-glass" type="text" autocomplete="family-name" placeholder="Tus apellidos">
              </div>

              <div class="field">
                <label for="profile-phone" class="actions-label">Teléfono</label>
                <input id="profile-phone" class="input-glass" type="tel" autocomplete="tel" placeholder="+34 …">
              </div>

              <div class="field">
                <label for="profile-email" class="actions-label">Email</label>
                <input id="profile-email" class="input-glass" type="email" disabled>
              </div>
            </div>
          </div>

          <!-- Sub-tarjeta: Dirección -->
          <div class="form-section">
            <div class="section-head">
              <h3 class="section-title">Dirección</h3>
              <p class="section-desc">Opcional.</p>
            </div>

            <div class="fields-grid">
              <div class="field field--full">
                <label for="profile-address" class="actions-label">Dirección</label>
                <input id="profile-address" class="input-glass" type="text" autocomplete="street-address" placeholder="Calle, número, piso…">
              </div>

              <div class="field">
                <label for="profile-city" class="actions-label">Ciudad</label>
                <input id="profile-city" class="input-glass" type="text" autocomplete="address-level2" placeholder="Ciudad">
              </div>

              <div class="field">
                <label for="profile-province" class="actions-label">Provincia</label>
                <input id="profile-province" class="input-glass" type="text" autocomplete="address-level1" placeholder="Provincia">
              </div>

              <div class="field">
                <label for="profile-postal" class="actions-label">Código Postal</label>
                <input id="profile-postal" class="input-glass" type="text" autocomplete="postal-code" placeholder="00000">
              </div>
            </div>
          </div>

        </form>
      </section>

    </div>

  </section>
`;

    UI.replaceWithAnimation(html);
    UI.updateActionPanel("");

    setTimeout(() => {
      document.querySelector(".back-btn")?.addEventListener("click", () => Router.setView("home"));

      document.getElementById("logout-btn")?.addEventListener("click", async () => {
        try {
          if (typeof logout === "function") await logout();
          else window.location.href = "login.html";
        } catch (e) {
          console.error("Error en logout:", e);
          window.location.href = "login.html";
        }
      });

      loadProfileIntoForm();
    }, 0);
  }

  async function loadProfileIntoForm() {
    try {
      const profile = await getProfile();
      const { data: { user } } = await client.auth.getUser();

      document.getElementById("profile-name").value     = profile.name     || "";
      document.getElementById("profile-surname").value  = profile.surname  || "";
      document.getElementById("profile-phone").value    = profile.phone    || "";
      document.getElementById("profile-address").value  = profile.address  || "";
      document.getElementById("profile-city").value     = profile.city     || "";
      document.getElementById("profile-province").value = profile.province || "";
      document.getElementById("profile-postal").value   = profile.postal   || "";
      document.getElementById("profile-email").value    = (user && user.email) || "";

      document.getElementById("profile-updated").textContent =
        profile.updated_at ? new Date(profile.updated_at).toLocaleString() : "—";

      if (profile.avatar_url) {
        document.getElementById("profile-avatar").src = profile.avatar_url;
      }

      // Al cargar: estado limpio
      window.__profileDirty = false;

      setupDirtyTracking(profile);
      setupProfileSave();
      setupAvatarUpload();

    } catch (e) {
      console.error("Error al cargar perfil:", e);
    }
  }

  // Habilita Guardar solo si hay cambios (y evita listeners duplicados)
  function setupDirtyTracking(originalProfile) {
    const form = document.getElementById("profile-form");
    const saveBtn = document.querySelector(".save-btn");
    if (!form || !saveBtn) return;

    const initial = {
      name: originalProfile.name || "",
      surname: originalProfile.surname || "",
      phone: originalProfile.phone || "",
      address: originalProfile.address || "",
      city: originalProfile.city || "",
      province: originalProfile.province || "",
      postal: originalProfile.postal || ""
    };

    function current() {
      return {
        name: document.getElementById("profile-name").value,
        surname: document.getElementById("profile-surname").value,
        phone: document.getElementById("profile-phone").value,
        address: document.getElementById("profile-address").value,
        city: document.getElementById("profile-city").value,
        province: document.getElementById("profile-province").value,
        postal: document.getElementById("profile-postal").value
      };
    }

    function check() {
      const cur = current();
      const changed = Object.keys(initial).some(k => initial[k] !== cur[k]);

      saveBtn.disabled = !changed;
      window.__profileDirty = changed;
    }

    if (form.dataset.dirtyBound === "1") {
      saveBtn.disabled = true;
      window.__profileDirty = false;
      return;
    }
    form.dataset.dirtyBound = "1";

    form.querySelectorAll("input:not([disabled])").forEach(el => {
      el.addEventListener("input", check);
      el.addEventListener("change", check);
    });

    saveBtn.disabled = true;
    window.__profileDirty = false;
  }

  function setupProfileSave() {
    const form = document.getElementById("profile-form");
    const saveBtn = document.querySelector(".save-btn");
    if (!form || form.dataset.bound === "1") return;

    form.dataset.bound = "1";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const values = {
        name:     document.getElementById("profile-name").value,
        surname:  document.getElementById("profile-surname").value,
        phone:    document.getElementById("profile-phone").value,
        address:  document.getElementById("profile-address").value,
        city:     document.getElementById("profile-city").value,
        province: document.getElementById("profile-province").value,
        postal:   document.getElementById("profile-postal").value,
      };

      try {
        await updateProfile(values);

        if (saveBtn) saveBtn.disabled = true;
        window.__profileDirty = false;

        document.getElementById("profile-updated").textContent =
          new Date().toLocaleString();

      } catch (err) {
        console.error("Error guardando perfil:", err);
      }
    });
  }

  // Guardado silencioso para "Guardar y salir"
  window.__saveProfileSilent = async function () {
    if (!window.__profileDirty) return true;

    const values = {
      name:     document.getElementById("profile-name")?.value || "",
      surname:  document.getElementById("profile-surname")?.value || "",
      phone:    document.getElementById("profile-phone")?.value || "",
      address:  document.getElementById("profile-address")?.value || "",
      city:     document.getElementById("profile-city")?.value || "",
      province: document.getElementById("profile-province")?.value || "",
      postal:   document.getElementById("profile-postal")?.value || "",
    };

    await updateProfile(values);

    const saveBtn = document.querySelector(".save-btn");
    if (saveBtn) saveBtn.disabled = true;

    window.__profileDirty = false;

    const updated = document.getElementById("profile-updated");
    if (updated) updated.textContent = new Date().toLocaleString();

    return true;
  };

  function setupAvatarUpload() {
    const btn   = document.getElementById("avatar-upload-btn");
    const input = document.getElementById("avatar-file");
    const img   = document.getElementById("profile-avatar");
    if (!btn || !input || !img || !window.client) return;

    btn.addEventListener("click", () => input.click());

    input.addEventListener("change", async () => {
      const file = input.files[0];
      if (!file) return;

      try {
        const { data: { user } } = await client.auth.getUser();
        if (!user) return;

        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await client.storage
          .from("avatars")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = client.storage.from("avatars").getPublicUrl(filePath);
        const publicUrl = data.publicUrl;

        await updateProfile({ avatar_url: publicUrl });
        img.src = publicUrl;

        document.getElementById("profile-updated").textContent =
          new Date().toLocaleString();

      } catch (e) {
        console.error("Error subida avatar:", e);
      }
    });
  }

  Router.registerView("user", renderUser);
})();