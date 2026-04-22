(function () {
  let allUsers = [];
  let selectedUserId = null;

  async function renderAdmin() {
    const profile = await getProfile();
    if (!profile || profile.role !== "admin") {
      Router.setView("home");
      return;
    }

    try {
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

    renderUserTable();
  }

  function renderUserTable() {
    let rows = "";
    (allUsers || []).forEach((u) => {
      const userId = u.user_id || u.id;
      const approved = u.approved ? "✅" : "❌";
      rows += `
        <tr class="user-row" data-user-id="${userId}">
          <td>${escapeHtml(u.name || "—")}</td>
          <td>${escapeHtml(u.surname || "—")}</td>
          <td>${escapeHtml(u.role || "—")}</td>
          <td>${approved}</td>
        </tr>
      `;
    });

    const html = `
      <section class="panel resultados" id="mainPanel">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem;">
          <h2 style="margin: 0; flex-shrink: 0;">Gestión de Usuarios</h2>
          <input type="text" id="searchInput" placeholder="Buscar..."
            style="flex: 1; max-width: 200px; padding: 0.35rem 0.65rem; border: 1.5px solid #004894; border-radius: 5px; background: #1F1F1F; color: #e6e7eb; font-size: 12px;" />
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
            <button class="action-btn" type="button" onclick="openNewUserForm()">
              <span class="icon">➕</span>
              <span class="action-text">Nuevo</span>
            </button>
            <button class="action-btn" type="button" id="btnEdit" disabled>
              <span class="icon">✏️</span>
              <span class="action-text">Editar</span>
            </button>
            <button class="action-btn danger" type="button" id="btnDelete" disabled>
              <span class="icon">🗑️</span>
              <span class="action-text">Eliminar</span>
            </button>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="glass-table">
            <thead><tr><th>Nombre</th><th>Apellidos</th><th>Rol</th><th>Aprobado</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    `;

    UI.replaceWithAnimation(html);

    // Attach event listeners after DOM is ready
    requestAnimationFrame(() => {
      // Initialize buttons state (disabled by default)
      updateButtonsState();

      const searchInput = document.getElementById("searchInput");
      searchInput?.addEventListener("input", (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = allUsers.filter(u =>
          `${u.name || ""} ${u.surname || ""}`.toLowerCase().includes(q)
        );
        renderFilteredTable(filtered);
      });

      document.querySelectorAll(".user-row").forEach(row => {
        row.addEventListener("click", () => {
          const userId = row.getAttribute("data-user-id");
          selectUser(userId);
        });
      });
    });
  }

  function renderFilteredTable(filtered) {
    let rows = "";
    (filtered || []).forEach((u) => {
      const userId = u.user_id || u.id;
      const approved = u.approved ? "✅" : "❌";
      rows += `
        <tr class="user-row" data-user-id="${userId}">
          <td>${escapeHtml(u.name || "—")}</td>
          <td>${escapeHtml(u.surname || "—")}</td>
          <td>${escapeHtml(u.role || "—")}</td>
          <td>${approved}</td>
        </tr>
      `;
    });

    const tbody = document.querySelector(".glass-table tbody");
    if (tbody) tbody.innerHTML = rows;

    setTimeout(() => {
      document.querySelectorAll(".user-row").forEach(row => {
        row.addEventListener("click", () => {
          const userId = row.getAttribute("data-user-id");
          selectUser(userId);
        });
      });
    }, 0);
  }

  function selectUser(userId) {
    selectedUserId = userId;
    document.querySelectorAll(".user-row").forEach(r => r.classList.remove("selected"));
    const target = document.querySelector(`.user-row[data-user-id="${userId}"]`);
    if (target) target.classList.add("selected");

    updateButtonsState();
  }

  function updateButtonsState() {
    const btnEdit = document.getElementById("btnEdit");
    const btnDelete = document.getElementById("btnDelete");

    if (selectedUserId) {
      // User selected - enable buttons and change onclick handlers
      btnEdit?.removeAttribute("disabled");
      btnDelete?.removeAttribute("disabled");
      btnEdit?.setAttribute("onclick", "openEditUserForm()");
      btnDelete?.setAttribute("onclick", "deleteSelectedUser()");
    } else {
      // No user selected - disable buttons
      btnEdit?.setAttribute("disabled", "");
      btnDelete?.setAttribute("disabled", "");
      btnEdit?.removeAttribute("onclick");
      btnDelete?.removeAttribute("onclick");
    }
  }


  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function openUserModal({ title, fields, onSave }) {
    let root = document.getElementById("admin-modal-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "admin-modal-root";
      document.body.appendChild(root);
    }

    const fieldsHtml = fields.map(f => `
      <div style="margin-bottom:10px">
        <label class="glass-modal-field-label" style="font-size:13px; margin-bottom:4px; display:block">${escapeHtml(f.label)}${f.required ? ' <span style="color:#fca5a5">*</span>' : ''}</label>
        ${f.type === "textarea"
          ? `<textarea id="adm-${f.id}" class="glass-modal-input" rows="2" style="font-size:14px">${escapeHtml(f.value || "")}</textarea>`
          : f.type === "select"
            ? `<select id="adm-${f.id}" class="glass-modal-input" style="font-size:14px">${f.options.map(opt => `<option value="${opt.value}" ${f.value === opt.value ? "selected" : ""}>${escapeHtml(opt.label)}</option>`).join("")}</select>`
            : f.type === "checkbox"
              ? `<label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size:14px">
                   <input type="checkbox" id="adm-${f.id}" ${f.value ? "checked" : ""} />
                   <span>${escapeHtml(f.label)}</span>
                 </label>`
              : `<input id="adm-${f.id}" class="glass-modal-input" type="${f.type || "text"}" value="${escapeHtml(f.value || "")}" placeholder="${escapeHtml(f.placeholder || "")}" style="font-size:14px" ${f.disabled ? "disabled" : ""} ${f.readonly ? "readonly" : ""} />`
        }
      </div>
    `).join("");

    root.innerHTML = `
      <div class="glass-modal-overlay" id="adm-overlay" role="dialog" aria-modal="true">
        <div class="glass-modal" style="width:520px;max-width:95vw">
          <div class="glass-modal-head">
            <div class="glass-modal-title">${escapeHtml(title)}</div>
            <button class="glass-modal-x" type="button" aria-label="Cerrar" onclick="closeAdminModal()">✕</button>
          </div>
          <div class="glass-modal-body" style="padding:16px 20px">
            ${fieldsHtml}
            <div id="adm-error" style="display:none;color:#fecaca;font-size:12px;margin-top:4px;background:rgba(255,80,80,.12);border:1px solid rgba(255,80,80,.25);padding:8px 12px;border-radius:8px"></div>
          </div>
          <div class="glass-modal-actions">
            <button class="ghost-btn glass-modal-cancel" type="button" onclick="closeAdminModal()">Cancelar</button>
            <button class="cta glass-modal-ok" type="button" onclick="__admSave()">💾 Guardar</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("adm-overlay").addEventListener("click", e => {
      if (e.target.id === "adm-overlay") closeAdminModal();
    });

    window.__admKeyDown = e => { if (e.key === "Escape") closeAdminModal(); };
    document.addEventListener("keydown", window.__admKeyDown, true);

    window.__admSave = onSave;

    setTimeout(() => document.getElementById("adm-overlay").focus(), 100);
  }

  window.openEditUserForm = function() {
    const user = allUsers.find(u => (u.user_id || u.id) === selectedUserId);
    if (!user) return;

    const roleLabel = { read: "Lector", write: "Editor", admin: "Administrador" }[user.role] || user.role;

    openUserModal({
      title: `Editar: ${escapeHtml(user.name || "Usuario")}`,
      fields: [
        { id: "name", label: "Nombre", type: "text", value: user.name, required: true },
        { id: "surname", label: "Apellidos", type: "text", value: user.surname },
        { id: "email", label: "Email", type: "email", value: user.email || "No disponible", readonly: true },
        { id: "phone", label: "Teléfono", type: "tel", value: user.phone },
        { id: "address", label: "Dirección", type: "text", value: user.address },
        { id: "city", label: "Ciudad", type: "text", value: user.city },
        { id: "province", label: "Provincia", type: "text", value: user.province },
        { id: "postal", label: "Código Postal", type: "text", value: user.postal },
        {
          id: "role",
          label: "Rol",
          type: "select",
          value: user.role,
          options: [
            { value: "read", label: "Lector (read)" },
            { value: "write", label: "Editor (write)" },
            { value: "admin", label: "Administrador" }
          ],
          required: true
        },
        { id: "approved", label: "Aprobado", type: "checkbox", value: user.approved }
      ],
      onSave: async () => {
        const changes = {
          name: document.getElementById("adm-name").value,
          surname: document.getElementById("adm-surname").value,
          email: document.getElementById("adm-email").value,
          phone: document.getElementById("adm-phone").value,
          address: document.getElementById("adm-address").value,
          city: document.getElementById("adm-city").value,
          province: document.getElementById("adm-province").value,
          postal: document.getElementById("adm-postal").value,
          role: document.getElementById("adm-role").value,
          approved: document.getElementById("adm-approved").checked
        };

        try {
          const { error } = await client
            .from("profiles")
            .update(changes)
            .eq("user_id", selectedUserId);

          if (error) throw error;

          Object.assign(user, changes);
          closeAdminModal();
          renderUserTable();

          const idx = allUsers.findIndex(u => (u.user_id || u.id) === selectedUserId);
          if (idx !== -1) selectUser(selectedUserId);
        } catch (e) {
          const errDiv = document.getElementById("adm-error");
          errDiv.style.display = "block";
          errDiv.textContent = e.message;
        }
      }
    });
  };

  window.openNewUserForm = function() {
    openUserModal({
      title: "Nuevo usuario",
      fields: [
        { id: "name", label: "Nombre", type: "text", required: true },
        { id: "surname", label: "Apellidos", type: "text" },
        { id: "email", label: "Email", type: "email", required: true },
        { id: "phone", label: "Teléfono", type: "tel" },
        { id: "address", label: "Dirección", type: "text" },
        { id: "city", label: "Ciudad", type: "text" },
        { id: "province", label: "Provincia", type: "text" },
        { id: "postal", label: "Código Postal", type: "text" },
        {
          id: "role",
          label: "Rol",
          type: "select",
          value: "read",
          options: [
            { value: "read", label: "Lector (read)" },
            { value: "write", label: "Editor (write)" },
            { value: "admin", label: "Administrador" }
          ],
          required: true
        },
        { id: "approved", label: "Aprobado", type: "checkbox", value: false }
      ],
      onSave: async () => {
        const newUser = {
          name: document.getElementById("adm-name").value,
          surname: document.getElementById("adm-surname").value,
          email: document.getElementById("adm-email").value,
          phone: document.getElementById("adm-phone").value,
          address: document.getElementById("adm-address").value,
          city: document.getElementById("adm-city").value,
          province: document.getElementById("adm-province").value,
          postal: document.getElementById("adm-postal").value,
          role: document.getElementById("adm-role").value,
          approved: document.getElementById("adm-approved").checked
        };

        if (!newUser.name || !newUser.email) {
          const errDiv = document.getElementById("adm-error");
          errDiv.style.display = "block";
          errDiv.textContent = "Nombre y Email son requeridos";
          return;
        }

        try {
          const { data, error } = await client
            .from("profiles")
            .insert([newUser])
            .select();

          if (error) throw error;

          allUsers.push(data[0]);
          closeAdminModal();
          renderUserTable();
        } catch (e) {
          const errDiv = document.getElementById("adm-error");
          errDiv.style.display = "block";
          errDiv.textContent = e.message;
        }
      }
    });
  };

  window.deleteSelectedUser = async function() {
    if (!selectedUserId || !confirm("¿Estás seguro de que quieres eliminar este usuario?")) return;

    try {
      const { error } = await client
        .from("profiles")
        .delete()
        .eq("user_id", selectedUserId);

      if (error) throw error;

      allUsers = allUsers.filter(u => (u.user_id || u.id) !== selectedUserId);
      selectedUserId = null;
      renderUserTable();
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  window.closeAdminModal = function() {
    const root = document.getElementById("admin-modal-root");
    if (root) {
      root.innerHTML = "";
      root.remove();
      document.getElementById("admin-modal-root").remove();
    }
    document.removeEventListener("keydown", window.__admKeyDown, true);
  };

  Router.registerView("admin", renderAdmin);
})();
