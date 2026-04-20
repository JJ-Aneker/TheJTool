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
      // Load ALL users - NO filters
      const { data, error } = await client
        .from("profiles")
        .select("*")
        .limit(1000);

      if (error) throw error;
      allUsers = data || [];
      filteredUsers = [...allUsers];

      console.log("Total users loaded:", allUsers.length);
      console.log("Users:", allUsers.map(u => ({ name: u.name, surname: u.surname, role: u.role })));
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
          <tr class="user-row" data-user-id="${userId}" style="cursor: pointer; border-bottom: 1px solid rgba(40,215,199,.1);">
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
        <input type="text" id="searchInput" placeholder="Buscar por nombre..."
          style="width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 1px solid rgba(40,215,199,.3); border-radius: 6px; background: rgba(10,20,40,0.5); color: rgba(238,244,255,.9);" />
        <p style="color: rgba(238,244,255,.7); margin-bottom: 1rem;">Total: ${filteredUsers.length} usuario(s) - Haz clic para editar</p>
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
          showEditModal();
        });
      });
    }, 0);
  }

  function showEditModal() {
    const user = allUsers.find(u => (u.user_id || u.id) === selectedUserId);
    if (!user) return;

    const fields = Object.keys(user)
      .filter(k => !readOnlyFields.includes(k))
      .sort();

    const formFields = fields.map(key => {
      const value = user[key];

      if (key === "approved") {
        return `<div style="margin-bottom: 1rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input type="checkbox" ${value ? "checked" : ""} data-field="${key}" style="cursor: pointer;" />
            <span>${key}</span>
          </label>
        </div>`;
      }

      if (key === "role") {
        return `<div style="margin-bottom: 1rem;">
          <label style="display: block; font-size: 0.9em; margin-bottom: 0.3rem; color: rgba(238,244,255,.8);">${key}</label>
          <select data-field="${key}" style="width: 100%; padding: 0.6rem; border: 1px solid rgba(40,215,199,.3); border-radius: 6px; background: rgba(10,20,40,0.5); color: rgba(238,244,255,.9); font-size: 1rem;">
            <option value="read" ${value === "read" ? "selected" : ""}>read</option>
            <option value="write" ${value === "write" ? "selected" : ""}>write</option>
            <option value="admin" ${value === "admin" ? "selected" : ""}>admin</option>
          </select>
        </div>`;
      }

      return `<div style="margin-bottom: 1rem;">
        <label style="display: block; font-size: 0.9em; margin-bottom: 0.3rem; color: rgba(238,244,255,.8);">${key}</label>
        <input type="text" data-field="${key}" value="${value === null ? "" : value}"
          style="width: 100%; padding: 0.6rem; border: 1px solid rgba(40,215,199,.3); border-radius: 6px; background: rgba(10,20,40,0.5); color: rgba(238,244,255,.9); font-size: 1rem;" />
      </div>`;
    }).join("");

    const modalHTML = `
      <div id="adminModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000;">
        <div style="background: rgba(20,30,50,0.95); border: 1px solid rgba(40,215,199,.3); border-radius: 12px; padding: 2rem; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;">
          <h2 style="margin-bottom: 1.5rem;">${user.name || "Usuario"} ${user.surname || ""}</h2>
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${formFields}
            <button id="saveModalBtn" class="cta" style="width: 100%; padding: 0.75rem;">💾 Guardar cambios</button>
            <button id="closeModalBtn" class="btn" style="width: 100%; padding: 0.75rem; background: rgba(40,215,199,.1); color: rgba(40,215,199,.9);">Cancelar</button>
          </div>
        </div>
      </div>
    `;

    // Insert modal into DOM
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    setTimeout(() => {
      document.getElementById("saveModalBtn")?.addEventListener("click", async () => {
        const changes = {};
        document.querySelectorAll("#adminModal [data-field]").forEach(input => {
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
          document.getElementById("adminModal")?.remove();
          renderUserList();
        } catch (e) {
          alert("Error: " + e.message);
        }
      });

      document.getElementById("closeModalBtn")?.addEventListener("click", () => {
        document.getElementById("adminModal")?.remove();
      });

      // Close on overlay click
      document.getElementById("adminModal")?.addEventListener("click", (e) => {
        if (e.target.id === "adminModal") {
          document.getElementById("adminModal")?.remove();
        }
      });
    }, 0);
  }

  Router.registerView("admin", renderAdmin);
})();
