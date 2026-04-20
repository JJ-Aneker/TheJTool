(function () {
  let allUsers = [];
  let filteredUsers = [];
  let selectedUserId = null;

  async function renderAdmin() {
    // Guard: Check if user is admin
    const profile = await getProfile();
    if (!profile || profile.role !== "admin") {
      Router.setView("home");
      return;
    }

    // Load ALL users from profiles (without any filter)
    try {
      const { data, error } = await client
        .from("profiles")
        .select("id, full_name, last_name, role, approved, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      allUsers = data || [];
      filteredUsers = [...allUsers];
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
      .map(user => {
        const approved = user.approved ? "✅ Sí" : "❌ No";
        return `
          <tr class="user-row" data-user-id="${user.id}">
            <td>${user.full_name || "—"}</td>
            <td>${user.last_name || "—"}</td>
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
            placeholder="Buscar por nombre, apellido o email..."
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
      // Attach search handler
      document.getElementById("searchInput")?.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        filteredUsers = allUsers.filter(u => {
          const fullName = `${u.full_name || ""} ${u.last_name || ""}`.toLowerCase();
          return fullName.includes(query);
        });
        renderUserList();
      });

      // Attach row click handlers
      document.querySelectorAll(".user-row").forEach(row => {
        row.style.cursor = "pointer";
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
    const user = allUsers.find(u => u.id === selectedUserId);
    if (!user) return;

    const panelHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div>
          <h3>${user.full_name || "Usuario"} ${user.last_name || ""}</h3>
          <p style="color: rgba(238,244,255,.6); font-size: 0.9em;">ID: ${user.id.substring(0, 8)}...</p>
        </div>

        <button class="action-card" id="editUserBtn" type="button">
          <span class="icon">✏️</span>
          <span class="action-text">Editar detalles</span>
        </button>

        <button class="action-card" id="toggleApprovedBtn" type="button">
          <span class="icon">${user.approved ? "✅" : "⏳"}</span>
          <span class="action-text">${user.approved ? "Desaprobar" : "Aprobar usuario"}</span>
        </button>

        <button class="action-card" id="changeRoleBtn" type="button">
          <span class="icon">👑</span>
          <span class="action-text">Cambiar rol</span>
        </button>
      </div>
    `;

    UI.updateActionPanel(panelHTML);

    setTimeout(() => {
      document.getElementById("editUserBtn")?.addEventListener("click", showEditForm);
      document.getElementById("toggleApprovedBtn")?.addEventListener("click", toggleApproved);
      document.getElementById("changeRoleBtn")?.addEventListener("click", showRoleSelector);
    }, 0);
  }

  function showEditForm() {
    const user = allUsers.find(u => u.id === selectedUserId);
    if (!user) return;

    const panelHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <h3>Editar Usuario</h3>

        <div>
          <label style="display: block; font-size: 0.9em; margin-bottom: 0.3rem; color: rgba(238,244,255,.8);">Nombre</label>
          <input
            type="text"
            id="editFullName"
            value="${user.full_name || ""}"
            style="width: 100%; padding: 0.6rem; border: 1px solid rgba(40,215,199,.3); border-radius: 6px; background: rgba(10,20,40,0.5); color: rgba(238,244,255,.9);"
          />
        </div>

        <div>
          <label style="display: block; font-size: 0.9em; margin-bottom: 0.3rem; color: rgba(238,244,255,.8);">Apellidos</label>
          <input
            type="text"
            id="editLastName"
            value="${user.last_name || ""}"
            style="width: 100%; padding: 0.6rem; border: 1px solid rgba(40,215,199,.3); border-radius: 6px; background: rgba(10,20,40,0.5); color: rgba(238,244,255,.9);"
          />
        </div>

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
      document.getElementById("saveEditBtn")?.addEventListener("click", async () => {
        const fullName = document.getElementById("editFullName").value;
        const lastName = document.getElementById("editLastName").value;

        try {
          const { error } = await client
            .from("profiles")
            .update({ full_name: fullName, last_name: lastName })
            .eq("id", selectedUserId);

          if (error) throw error;

          // Update local state
          const user = allUsers.find(u => u.id === selectedUserId);
          if (user) {
            user.full_name = fullName;
            user.last_name = lastName;
          }

          // Show success
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
          alert("Error: " + error.message);
        }
      });

      document.getElementById("cancelEditBtn")?.addEventListener("click", showEditPanel);
    }, 0);
  }

  async function toggleApproved() {
    const user = allUsers.find(u => u.id === selectedUserId);
    if (!user) return;

    try {
      const newStatus = !user.approved;
      const { error } = await client
        .from("profiles")
        .update({ approved: newStatus })
        .eq("id", selectedUserId);

      if (error) throw error;

      user.approved = newStatus;
      renderUserList();
      showEditPanel();
    } catch (error) {
      alert("Error: " + error.message);
    }
  }

  function showRoleSelector() {
    const user = allUsers.find(u => u.id === selectedUserId);
    if (!user) return;

    const panelHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <h3>Cambiar Rol</h3>
        <p style="color: rgba(238,244,255,.7); font-size: 0.9em;">Rol actual: <strong>${user.role}</strong></p>

        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <button class="action-card role-btn" data-role="read" type="button">
            <span class="icon">👁️</span>
            <span class="action-text">Lector (read)</span>
          </button>
          <button class="action-card role-btn" data-role="write" type="button">
            <span class="icon">✏️</span>
            <span class="action-text">Editor (write)</span>
          </button>
          <button class="action-card role-btn" data-role="admin" type="button">
            <span class="icon">👑</span>
            <span class="action-text">Administrador (admin)</span>
          </button>
        </div>

        <button class="btn" id="cancelRoleBtn" style="width: 100%; background: rgba(40,215,199,.1); color: rgba(40,215,199,.9);">
          ❌ Cancelar
        </button>
      </div>
    `;

    UI.updateActionPanel(panelHTML);

    setTimeout(() => {
      document.querySelectorAll(".role-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const newRole = btn.getAttribute("data-role");
          try {
            const { error } = await client
              .from("profiles")
              .update({ role: newRole })
              .eq("id", selectedUserId);

            if (error) throw error;

            user.role = newRole;
            renderUserList();
            showEditPanel();
          } catch (error) {
            alert("Error: " + error.message);
          }
        });
      });

      document.getElementById("cancelRoleBtn")?.addEventListener("click", showEditPanel);
    }, 0);
  }

  Router.registerView("admin", renderAdmin);
})();
