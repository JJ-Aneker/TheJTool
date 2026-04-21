(function () {
  let allUsers = [];
  let selectedUser = null;
  window.__adminDirty = false;

  // Guard de cambios sin guardar (igual a user.js)
  if (window.Router && typeof Router.addBeforeLeaveHook === "function") {
    Router.addBeforeLeaveHook(async ({ from, to }) => {
      if (from !== "admin") return true;
      if (to === "admin") return true;
      if (!window.__adminDirty) return true;

      const choice = await UI.prompt3({
        title: "Cambios sin guardar",
        message: "Tienes cambios sin guardar. ¿Qué quieres hacer?",
        primaryText: "Guardar y salir",
        secondaryText: "Volver",
        tertiaryText: "Salir sin guardar",
        dangerTertiary: true
      });

      if (choice === "secondary") return false;
      if (choice === "tertiary") return true;
      if (choice === "primary") {
        try {
          const ok = await window.__saveAdminSilent?.();
          return ok === true;
        } catch (e) {
          console.error("Error guardando:", e);
          return false;
        }
      }
      return false;
    });
  }

  async function renderAdmin() {
    const profile = await getProfile();
    if (!profile || profile.role !== "admin") {
      Router.setView("home");
      return;
    }

    try {
      // Use getAllProfiles which respects admin role
      allUsers = await getAllProfiles();
      console.log("Users loaded:", allUsers.length);
    } catch (error) {
      console.error("Error:", error);
      UI.replaceWithAnimation(`
        <section class="panel"><h2>Error</h2>
        <p style="color: #ff6b6b;">${error.message}</p></section>
      `);
      return;
    }

    renderUserList();
  }

  function renderUserList() {
    const tableRows = allUsers
      .map(user => {
        const userId = user.user_id || user.id;
        const approved = user.approved ? "✅" : "❌";
        return `
          <tr class="user-row" data-user-id="${userId}" style="cursor: pointer;">
            <td>${user.name || "—"}</td>
            <td>${user.surname || "—"}</td>
            <td>${user.role || "—"}</td>
            <td>${approved}</td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <section class="panel resultados" id="mainPanel">
        <div class="page-header">
          <div class="page-header-content">
            <h2>Gestión de Usuarios</h2>
            <p>Busca y edita usuarios del sistema.</p>
          </div>
        </div>

        <input type="text" id="searchInput" placeholder="Buscar..."
          style="width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 1px solid rgba(40,215,199,.3); border-radius: 6px; background: rgba(10,20,40,0.5); color: rgba(238,244,255,.9);" />

        <p style="color: rgba(238,244,255,.7); margin-bottom: 1rem;">Total: ${allUsers.length}</p>

        <div class="table-wrapper">
          <table class="glass-table">
            <thead><tr><th>Nombre</th><th>Apellidos</th><th>Rol</th><th>Aprobado</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </section>
    `;

    UI.replaceWithAnimation(html);
    UI.updateActionPanel("");

    setTimeout(() => {
      document.getElementById("searchInput")?.addEventListener("input", (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = allUsers.filter(u =>
          `${u.name || ""} ${u.surname || ""}`.toLowerCase().includes(q)
        );
        renderFilteredTable(filtered);
      });

      document.querySelectorAll(".user-row").forEach(row => {
        row.addEventListener("click", () => {
          const userId = row.getAttribute("data-user-id");
          selectedUser = allUsers.find(u => (u.user_id || u.id) === userId);
          if (selectedUser) showUserForm();
        });
      });
    }, 0);
  }

  function renderFilteredTable(filtered) {
    const tableRows = filtered
      .map(user => {
        const userId = user.user_id || user.id;
        const approved = user.approved ? "✅" : "❌";
        return `
          <tr class="user-row" data-user-id="${userId}" style="cursor: pointer;">
            <td>${user.name || "—"}</td>
            <td>${user.surname || "—"}</td>
            <td>${user.role || "—"}</td>
            <td>${approved}</td>
          </tr>
        `;
      })
      .join("");

    const tbody = document.querySelector(".glass-table tbody");
    if (tbody) tbody.innerHTML = tableRows;

    setTimeout(() => {
      document.querySelectorAll(".user-row").forEach(row => {
        row.addEventListener("click", () => {
          const userId = row.getAttribute("data-user-id");
          selectedUser = allUsers.find(u => (u.user_id || u.id) === userId);
          if (selectedUser) showUserForm();
        });
      });
    }, 0);
  }

  function showUserForm() {
    const user = selectedUser;
    if (!user) return;

    const html = `
      <section class="panel resultados user-profile" id="mainPanel">
        <div class="page-header">
          <div class="page-header-content">
            <h2>${user.name || "Usuario"} ${user.surname || ""}</h2>
            <p>Edita la información de este usuario.</p>
          </div>
          <button class="ghost-btn back-btn" type="button">← Volver</button>
        </div>

        <div class="profile-grid">
          <aside class="profile-card profile-card--avatar">
            <div class="avatar-block avatar-block--centered">
              <img src="${user.avatar_url || 'avatar.png'}" class="avatar avatar--xl" alt="Avatar" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover;">
              <button type="submit" form="admin-form" class="cta profile-action-btn save-btn">
                💾 Guardar cambios
              </button>
              <button class="ghost-btn back-btn" style="margin-top: 0.5rem;">← Volver</button>
            </div>
          </aside>

          <section class="profile-card profile-card--form profile-card--full">
            <form id="admin-form" class="profile-form">

              <div class="form-section">
                <div class="section-head">
                  <h3 class="section-title">Datos personales</h3>
                </div>
                <div class="fields-grid">
                  <div class="field">
                    <label class="actions-label">Nombre</label>
                    <input id="form-name" class="input-glass" type="text" value="${user.name || ''}">
                  </div>
                  <div class="field">
                    <label class="actions-label">Apellidos</label>
                    <input id="form-surname" class="input-glass" type="text" value="${user.surname || ''}">
                  </div>
                  <div class="field">
                    <label class="actions-label">Email</label>
                    <input id="form-email" class="input-glass" type="email" value="${user.email || ''}" disabled style="opacity: 0.6;">
                  </div>
                  <div class="field">
                    <label class="actions-label">Teléfono</label>
                    <input id="form-phone" class="input-glass" type="tel" value="${user.phone || ''}">
                  </div>
                </div>
              </div>

              <div class="form-section">
                <div class="section-head">
                  <h3 class="section-title">Dirección</h3>
                </div>
                <div class="fields-grid">
                  <div class="field field--full">
                    <label class="actions-label">Dirección</label>
                    <input id="form-address" class="input-glass" type="text" value="${user.address || ''}">
                  </div>
                  <div class="field">
                    <label class="actions-label">Ciudad</label>
                    <input id="form-city" class="input-glass" type="text" value="${user.city || ''}">
                  </div>
                  <div class="field">
                    <label class="actions-label">Provincia</label>
                    <input id="form-province" class="input-glass" type="text" value="${user.province || ''}">
                  </div>
                  <div class="field">
                    <label class="actions-label">Código Postal</label>
                    <input id="form-postal" class="input-glass" type="text" value="${user.postal || ''}">
                  </div>
                </div>
              </div>

              <div class="form-section">
                <div class="section-head">
                  <h3 class="section-title">Permisos</h3>
                </div>
                <div class="fields-grid">
                  <div class="field">
                    <label class="actions-label">Rol</label>
                    <select id="form-role" class="input-glass" style="padding: 0.6rem;">
                      <option value="read" ${user.role === "read" ? "selected" : ""}>Lector (read)</option>
                      <option value="write" ${user.role === "write" ? "selected" : ""}>Editor (write)</option>
                      <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
                    </select>
                  </div>
                  <div class="field">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                      <input type="checkbox" id="form-approved" ${user.approved ? "checked" : ""}>
                      <span class="actions-label">Aprobado</span>
                    </label>
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
      const form = document.getElementById("admin-form");
      const inputs = form?.querySelectorAll("input, select");

      inputs?.forEach(input => {
        input.addEventListener("change", () => {
          window.__adminDirty = true;
        });
        input.addEventListener("input", () => {
          window.__adminDirty = true;
        });
      });

      document.querySelectorAll(".back-btn").forEach(btn => {
        btn.addEventListener("click", renderUserList);
      });

      document.querySelector(".save-btn")?.addEventListener("click", async (e) => {
        e.preventDefault();
        await saveUser();
      });
    }, 0);
  }

  async function saveUser() {
    if (!selectedUser) return;

    const changes = {
      name: document.getElementById("form-name").value,
      surname: document.getElementById("form-surname").value,
      phone: document.getElementById("form-phone").value,
      address: document.getElementById("form-address").value,
      city: document.getElementById("form-city").value,
      province: document.getElementById("form-province").value,
      postal: document.getElementById("form-postal").value,
      role: document.getElementById("form-role").value,
      approved: document.getElementById("form-approved").checked
    };

    try {
      const { error } = await client
        .from("profiles")
        .update(changes)
        .eq("user_id", selectedUser.user_id || selectedUser.id);

      if (error) throw error;

      Object.assign(selectedUser, changes);
      window.__adminDirty = false;

      const btn = document.querySelector(".save-btn");
      btn.textContent = "✅ Guardado";
      btn.disabled = true;

      setTimeout(() => {
        btn.textContent = "💾 Guardar cambios";
        btn.disabled = false;
      }, 1500);
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  window.__saveAdminSilent = saveUser;

  Router.registerView("admin", renderAdmin);
})();
