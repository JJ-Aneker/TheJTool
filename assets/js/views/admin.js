(function () {
  let allUsers = [];
  let filteredUsers = [];
  let selectedUserId = null;

  // Campos no editables
  const readOnlyFields = ["user_id", "created_at", "updated_at", "avatar_url"];
  // Campos a mostrar en lista
  const listFields = ["name", "surname", "role", "approved"];

  async function renderAdmin() {
    // Guard: Check if user is admin
    const profile = await getProfile();
    if (!profile || profile.role !== "admin") {
      Router.setView("home");
      return;
    }

    // Load ALL users from profiles
    try {
      const { data, error } = await client
        .from("profiles")
        .select("*");

      if (error) throw error;
      allUsers = data || [];
      filteredUsers = [...allUsers];
      console.log("Usuarios cargados:", allUsers.length, allUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      UI.replaceWithAnimation(`
        <section class="panel">
          <h2>Error</h2>
          <p style="color: #ff6b6b;">Error al cargar usuarios: ${error.message}</p>
        </section>
      `);
      return;
    }

    renderUserList();
  }

  function renderUserList() {
    const tableRows = filteredUsers
      .map((user, idx) => {
        const userId = user.user_id || user.id;
        const approved = user.approved ? "✅ Sí" : "❌ No";
        const name = user.name || "—";
        const surname = user.surname || "—";
        return `
          <tr class="user-row" data-user-id="${userId}" data-index="${idx}" style="cursor: pointer;">
            <td>${name}</td>
            <td>${surname}</td>
            <td>${user.role || "—"}</td>
            <td>${approved}</td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <section class="panel resultados">
        <h2>Gestión de Usuarios</h2>

        <div style="margin-bottom: 1.5rem;">
          <input
            type="text"
            id="searchInput"
            placeholder="Buscar por nombre, apellido..."
            style="
              width: 100%;
              padding: 0.75rem;
              border: 1px solid rgba(40,215,199,.3);
              border-radius: 6px;
              background: rgba(10,20,40,0.5);
              color: rgba(238,244,255,.9);
              font-size: 1rem;
            "
          />
        </div>

        <p style="color: rgba(238,244,255,.7); font-size: 0.9em; margin-bottom: 1rem;">
          Total: ${filteredUsers.length} usuario(s) — Haz clic en una fila para editar
        </p>

        <div class="table-wrapper">
          <table class="glass-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Apellidos</th>
                <th>Rol</th>
                <th>Aprobado</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="4" style="text-align:center; color: rgba(238,244,255,.5);">No hay usuarios</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>
    `;

    UI.replaceWithAnimation(html);
    UI.updateActionPanel("");

    setTimeout(() => {
      // Search
      document.getElementById("searchInput")?.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        filteredUsers = allUsers.filter(u => {
          const fullName = `${u.name || ""} ${u.surname || ""}`.toLowerCase();
          return fullName.includes(query);
        });
        renderUserList();
      });

      // Row click
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
    if (!user) {
      console.error("User not found:", selectedUserId);
      return;
    }

    const panelHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div>
          <h3>${user.name || "Usuario"} ${user.surname || ""}</h3>
        </div>
        <button class="action-card" id="editAllFieldsBtn" type="button">
          <span class="icon">✏️</span>
          <span class="action-text">Editar todos los campos</span>
        </button>
      </div>
    `;

    UI.updateActionPanel(panelHTML);

    setTimeout(() => {
      document.getElementById("editAllFieldsBtn")?.addEventListener("click", showEditForm);
    }, 0);
  }

  function showEditForm() {
    const user = allUsers.find(u => (u.user_id || u.id) === selectedUserId);
    if (!user) return;

    // Generar formulario dinámico con TODOS los campos
    const formFields = Object.entries(user)
      .filter(([key]) => !readOnlyFields.includes(key))
      .map(([key, value]) => {
        if (key === "approved") {
          return `
            <div>
              <label style="display: block; font-size: 0.9em; margin-bottom: 0.5rem; color: rgba(238,244,255,.8);">
                <input type="checkbox" ${value ? "checked" : ""} class="field-input" data-field="${key}" />
                ${key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
            </div>
          `;
        }
        if (key === "role") {
          return `
            <div>
              <label style="display: block; font-size: 0.9em; margin-bottom: 0.3rem; color: rgba(238,244,255,.8);">Rol</label>
              <select class="field-input" data-field="${key}" style="width: 100%; padding: 0.6rem; border: 1px solid rgba(40,215,199,.3); border-radius: 6px; background: rgba(10,20,40,0.5); color: rgba(238,244,255,.9);">
                <option value="read" ${value === "read" ? "selected" : ""}>Lector (read)</option>
                <option value="write" ${value === "write" ? "selected" : ""}>Editor (write)</option>
                <option value="admin" ${value === "admin" ? "selected" : ""}>Admin (admin)</option>
              </select>
            </div>
          `;
        }
        return `
          <div>
            <label style="display: block; font-size: 0.9em; margin-bottom: 0.3rem; color: rgba(238,244,255,.8);">
              ${key.charAt(0).toUpperCase() + key.slice(1)}
            </label>
            <input
              type="text"
              class="field-input"
              data-field="${key}"
              value="${value || ""}"
              style="width: 100%; padding: 0.6rem; border: 1px solid rgba(40,215,199,.3); border-radius: 6px; background: rgba(10,20,40,0.5); color: rgba(238,244,255,.9);"
            />
          </div>
        `;
      })
      .join("");

    const panelHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem; max-height: 80vh; overflow-y: auto;">
        <h3>Editar Usuario</h3>
        ${formFields}
        <button class="cta" id="saveEditBtn" style="width: 100%; margin-top: 1rem;">
          💾 Guardar cambios
        </button>
        <button class="btn" id="cancelEditBtn" style="width: 100%; background: rgba(40,215,199,.1); color: rgba(40,215,199,.9);">
          ❌ Cancelar
        </button>
      </div>
    `;

    UI.updateActionPanel(panelHTML);

    setTimeout(() => {
      document.getElementById("saveEditBtn")?.addEventListener("click", saveChanges);
      document.getElementById("cancelEditBtn")?.addEventListener("click", showEditPanel);
    }, 0);
  }

  async function saveChanges() {
    const user = allUsers.find(u => (u.user_id || u.id) === selectedUserId);
    if (!user) return;

    const changes = {};
    document.querySelectorAll(".field-input").forEach(input => {
      const field = input.getAttribute("data-field");
      if (input.type === "checkbox") {
        changes[field] = input.checked;
      } else {
        changes[field] = input.value;
      }
    });

    try {
      const { error } = await client
        .from("profiles")
        .update(changes)
        .eq("user_id", selectedUserId);

      if (error) throw error;

      // Update local state
      Object.assign(user, changes);

      const btn = document.getElementById("saveEditBtn");
      const originalText = btn.textContent;
      btn.textContent = "✅ Guardado";
      btn.disabled = true;

      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        renderUserList();
        showEditPanel();
      }, 1500);
    } catch (error) {
      alert("Error al guardar: " + error.message);
    }
  }

  Router.registerView("admin", renderAdmin);
})();
