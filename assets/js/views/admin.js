(function () {
  let allUsers = [];
  let selectedUserId = null;

  async function renderAdmin() {
    // Guard: Check if user is admin
    const profile = await getProfile();
    if (!profile || profile.role !== "admin") {
      Router.setView("home");
      return;
    }

    // Load all users
    try {
      const { data, error } = await client
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      allUsers = data || [];
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

    // Generate table HTML with ALL fields
    const fieldNames = allUsers.length > 0 ? Object.keys(allUsers[0]) : [];
    const tableHeaders = fieldNames.map(f => `<th>${f}</th>`).join("");
    const tableRows = allUsers
      .map(user => {
        const cells = fieldNames
          .map(f => {
            const val = user[f];
            const displayVal = val === null ? "—" :
                               typeof val === "object" ? JSON.stringify(val).substring(0, 30) :
                               String(val).substring(0, 50);
            return `<td>${displayVal}</td>`;
          })
          .join("");
        return `<tr class="user-row" data-user-id="${user.id}">${cells}</tr>`;
      })
      .join("");

    const html = `
      <section class="panel">
        <h2>Gestión de Usuarios</h2>
        <p style="color: rgba(238,244,255,.7); font-size: 0.9em; margin-bottom: 1rem;">
          Total: ${allUsers.length} usuario(s) — Haz clic en una fila para editar
        </p>
        <div class="table-wrapper">
          <table class="glass-table">
            <thead>
              <tr>${tableHeaders}</tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </section>
    `;

    UI.replaceWithAnimation(html);

    // Attach row click handlers
    setTimeout(() => {
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

    const fieldNames = Object.keys(user);
    const formFields = fieldNames
      .map(field => {
        const val = user[field];
        let input = "";

        if (field === "id") {
          // ID is read-only
          input = `<input type="text" value="${val}" disabled style="opacity: 0.6;">`;
        } else if (field === "created_at" || field === "updated_at") {
          // Timestamps are read-only
          input = `<input type="text" value="${val}" disabled style="opacity: 0.6;">`;
        } else if (field === "approved") {
          // Checkbox for booleans
          input = `<input type="checkbox" ${val ? "checked" : ""} class="field-input" data-field="${field}">`;
        } else {
          // Text input for everything else
          input = `<input type="text" value="${val || ""}" class="field-input" data-field="${field}">`;
        }

        return `
          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.9em; margin-bottom: 0.3rem; color: rgba(238,244,255,.8);">
              ${field}
            </label>
            ${input}
          </div>
        `;
      })
      .join("");

    const panelHTML = `
      <div>
        <h3 style="margin-bottom: 1rem;">Editar Usuario</h3>
        <div style="max-height: 600px; overflow-y: auto;">
          ${formFields}
        </div>
        <button id="btnSaveUser" class="cta" style="margin-top: 1.5rem; width: 100%;">
          💾 Guardar Cambios
        </button>
      </div>
    `;

    UI.updateActionPanel(panelHTML);

    // Attach save handler
    setTimeout(() => {
      document.getElementById("btnSaveUser")?.addEventListener("click", saveUser);
    }, 0);
  }

  async function saveUser() {
    if (!selectedUserId) return;

    const user = allUsers.find(u => u.id === selectedUserId);
    if (!user) return;

    // Collect form data
    const changes = {};
    document.querySelectorAll(".field-input").forEach(input => {
      const field = input.getAttribute("data-field");
      if (field === "approved") {
        changes[field] = input.checked;
      } else {
        changes[field] = input.value;
      }
    });

    try {
      const { error } = await client
        .from("profiles")
        .update(changes)
        .eq("id", selectedUserId);

      if (error) throw error;

      // Update local state
      Object.assign(user, changes);

      // Show success feedback
      const btn = document.getElementById("btnSaveUser");
      const originalText = btn.textContent;
      btn.textContent = "✅ Guardado";
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 2000);
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Error al guardar: " + error.message);
    }
  }

  Router.registerView("admin", renderAdmin);
})();
