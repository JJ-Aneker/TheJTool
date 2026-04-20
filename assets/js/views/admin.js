(function () {
  let allUsers = [];
  let filteredUsers = [];
  let selectedUserId = null;

  const readOnlyFields = ["user_id", "created_at", "updated_at", "avatar_url"];

  async function renderAdmin() {
    const profile = await getProfile();
    if (!profile || profile.role !== "admin") {
      Router.setView("home");
      return;
    }

    try {
      const { data, error } = await client
        .from("profiles")
        .select("*");

      if (error) throw error;
      allUsers = data || [];
      filteredUsers = [...allUsers];
      console.log("Users loaded:", allUsers.length, allUsers);
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
    const tableRows = filteredUsers
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
      <section class="panel resultados">
        <h2>Gestión de Usuarios</h2>
        <input type="text" id="searchInput" placeholder="Buscar..."
          style="width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 1px solid rgba(40,215,199,.3); border-radius: 6px; background: rgba(10,20,40,0.5); color: rgba(238,244,255,.9);" />
        <p style="color: rgba(238,244,255,.7); margin-bottom: 1rem;">Total: ${filteredUsers.length} usuario(s)</p>
        <div class="table-wrapper">
          <table class="glass-table">
            <thead><tr><th>Nombre</th><th>Apellidos</th><th>Rol</th><th>Aprobado</th></tr></thead>
            <tbody>${tableRows || '<tr><td colspan="4">No hay usuarios</td></tr>'}</tbody>
          </table>
        </div>
      </section>
    `;

    UI.replaceWithAnimation(html);
    UI.updateActionPanel("");

    setTimeout(() => {
      document.getElementById("searchInput")?.addEventListener("input", (e) => {
        const q = e.target.value.toLowerCase();
        filteredUsers = allUsers.filter(u =>
          `${u.name || ""} ${u.surname || ""}`.toLowerCase().includes(q)
        );
        renderUserList();
      });

      document.querySelectorAll(".user-row").forEach(row => {
        row.addEventListener("click", () => {
          selectedUserId = row.getAttribute("data-user-id");
          document.querySelectorAll(".user-row").forEach(r => r.style.backgroundColor = "");
          row.style.backgroundColor = "rgba(40, 215, 199, 0.1)";
          showEditPanel();
        });
      });
    }, 0);
  }

  function showEditPanel() {
    const user = allUsers.find(u => (u.user_id || u.id) === selectedUserId);
    if (!user) return;

    const panelHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <h3>${user.name || "Usuario"} ${user.surname || ""}</h3>
        <button class="action-card" id="editBtn" type="button">
          <span class="icon">✏️</span>
          <span class="action-text">Editar todos los campos</span>
        </button>
      </div>
    `;

    UI.updateActionPanel(panelHTML);
    setTimeout(() => {
      document.getElementById("editBtn")?.addEventListener("click", showEditForm);
    }, 0);
  }

  function showEditForm() {
    const user = allUsers.find(u => (u.user_id || u.id) === selectedUserId);
    if (!user) return;

    const fields = Object.keys(user)
      .filter(k => !readOnlyFields.includes(k))
      .sort();

    const formFields = fields.map(key => {
      const value = user[key];

      if (key === "approved") {
        return `<div>
          <label style="display: block; font-size: 0.9em; margin-bottom: 0.5rem; color: rgba(238,244,255,.8);">
            <input type="checkbox" ${value ? "checked" : ""} data-field="${key}" />
            ${key}
          </label>
        </div>`;
      }

      if (key === "role") {
        return `<div>
          <label style="display: block; font-size: 0.9em; margin-bottom: 0.3rem; color: rgba(238,244,255,.8);">${key}</label>
          <select data-field="${key}" style="width: 100%; padding: 0.6rem; border: 1px solid rgba(40,215,199,.3); border-radius: 6px; background: rgba(10,20,40,0.5); color: rgba(238,244,255,.9);">
            <option value="read" ${value === "read" ? "selected" : ""}>read</option>
            <option value="write" ${value === "write" ? "selected" : ""}>write</option>
            <option value="admin" ${value === "admin" ? "selected" : ""}>admin</option>
          </select>
        </div>`;
      }

      return `<div>
        <label style="display: block; font-size: 0.9em; margin-bottom: 0.3rem; color: rgba(238,244,255,.8);">${key}</label>
        <input type="text" data-field="${key}" value="${value || ""}"
          style="width: 100%; padding: 0.6rem; border: 1px solid rgba(40,215,199,.3); border-radius: 6px; background: rgba(10,20,40,0.5); color: rgba(238,244,255,.9);" />
      </div>`;
    }).join("");

    const panelHTML = `
      <div style="max-height: 80vh; overflow-y: auto;">
        <h3>Editar Usuario</h3>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${formFields}
          <button class="cta" id="saveBtn" style="width: 100%;">💾 Guardar</button>
          <button class="btn" id="cancelBtn" style="width: 100%; background: rgba(40,215,199,.1); color: rgba(40,215,199,.9);">Cancelar</button>
        </div>
      </div>
    `;

    UI.updateActionPanel(panelHTML);

    setTimeout(() => {
      document.getElementById("saveBtn")?.addEventListener("click", async () => {
        const changes = {};
        document.querySelectorAll("[data-field]").forEach(input => {
          const field = input.getAttribute("data-field");
          changes[field] = input.type === "checkbox" ? input.checked : input.value;
        });

        try {
          const { error } = await client
            .from("profiles")
            .update(changes)
            .eq("user_id", selectedUserId);

          if (error) throw error;
          Object.assign(user, changes);

          const btn = document.getElementById("saveBtn");
          btn.textContent = "✅ Guardado";
          btn.disabled = true;
          setTimeout(() => {
            btn.textContent = "💾 Guardar";
            btn.disabled = false;
            renderUserList();
            showEditPanel();
          }, 1500);
        } catch (e) {
          alert("Error: " + e.message);
        }
      });

      document.getElementById("cancelBtn")?.addEventListener("click", showEditPanel);
    }, 0);
  }

  Router.registerView("admin", renderAdmin);
})();
