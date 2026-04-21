(function () {
  let currentProfile = null;

  async function renderUser() {
    try {
      currentProfile = await getProfile();
      const roleLabel = { read: "Lector", write: "Editor", admin: "Administrador" }[currentProfile.role] || currentProfile.role;

      const html = `
        <section class="panel resultados" id="mainPanel">
          <div class="page-header">
            <div class="page-header-content">
              <h2>Datos de usuario</h2>
              <p>Actualiza tu información personal.</p>
            </div>
          </div>

          <div class="profile-grid">
            <aside class="profile-card profile-card--avatar">
              <div class="avatar-block avatar-block--centered">
                <img id="profile-avatar" src="${currentProfile.avatar_url || 'avatar.png'}" class="avatar avatar--xl" alt="Avatar" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover;">
                <input type="file" id="avatar-file" accept="image/*" style="display:none">
                <button id="avatar-upload-btn" type="button" class="cta profile-action-btn">
                  Cambiar foto
                </button>
                <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(40,215,199,.1);">
                  <p style="color: rgba(238,244,255,.7); font-size: 0.85rem; margin-bottom: 0.5rem;">
                    <strong>${escapeHtml(currentProfile.name || "Usuario")}</strong>
                  </p>
                  <p style="color: rgba(238,244,255,.5); font-size: 0.75rem;">
                    ${escapeHtml(roleLabel)}
                  </p>
                </div>
              </div>
            </aside>

            <section class="profile-card profile-card--form profile-card--full">
              <div class="form-section">
                <div class="section-head">
                  <h3 class="section-title">Información del perfil</h3>
                  <p class="section-desc">Tus datos en el sistema.</p>
                </div>

                <div class="fields-grid">
                  <div class="field">
                    <label class="actions-label">Nombre</label>
                    <p style="color: rgba(238,244,255,.8); padding: 0.6rem; background: rgba(10,20,40,0.5); border-radius: 6px;">
                      ${escapeHtml(currentProfile.name || "—")}
                    </p>
                  </div>
                  <div class="field">
                    <label class="actions-label">Apellidos</label>
                    <p style="color: rgba(238,244,255,.8); padding: 0.6rem; background: rgba(10,20,40,0.5); border-radius: 6px;">
                      ${escapeHtml(currentProfile.surname || "—")}
                    </p>
                  </div>
                  <div class="field">
                    <label class="actions-label">Email</label>
                    <p style="color: rgba(238,244,255,.8); padding: 0.6rem; background: rgba(10,20,40,0.5); border-radius: 6px;">
                      ${escapeHtml(currentProfile.email || "—")}
                    </p>
                  </div>
                  <div class="field">
                    <label class="actions-label">Rol</label>
                    <p style="color: rgba(40,215,199,.95); padding: 0.6rem; background: rgba(40,215,199,0.1); border-radius: 6px; font-weight: 500;">
                      ${escapeHtml(roleLabel)}
                    </p>
                  </div>
                </div>
              </div>

              <div class="form-section">
                <div class="section-head">
                  <h3 class="section-title">Contacto</h3>
                </div>
                <div class="fields-grid">
                  <div class="field field--full">
                    <label class="actions-label">Teléfono</label>
                    <p style="color: rgba(238,244,255,.8); padding: 0.6rem; background: rgba(10,20,40,0.5); border-radius: 6px;">
                      ${escapeHtml(currentProfile.phone || "—")}
                    </p>
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
                    <p style="color: rgba(238,244,255,.8); padding: 0.6rem; background: rgba(10,20,40,0.5); border-radius: 6px;">
                      ${escapeHtml(currentProfile.address || "—")}
                    </p>
                  </div>
                  <div class="field">
                    <label class="actions-label">Ciudad</label>
                    <p style="color: rgba(238,244,255,.8); padding: 0.6rem; background: rgba(10,20,40,0.5); border-radius: 6px;">
                      ${escapeHtml(currentProfile.city || "—")}
                    </p>
                  </div>
                  <div class="field">
                    <label class="actions-label">Provincia</label>
                    <p style="color: rgba(238,244,255,.8); padding: 0.6rem; background: rgba(10,20,40,0.5); border-radius: 6px;">
                      ${escapeHtml(currentProfile.province || "—")}
                    </p>
                  </div>
                  <div class="field">
                    <label class="actions-label">Código Postal</label>
                    <p style="color: rgba(238,244,255,.8); padding: 0.6rem; background: rgba(10,20,40,0.5); border-radius: 6px;">
                      ${escapeHtml(currentProfile.postal || "—")}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      `;

      UI.replaceWithAnimation(html);
      showProfileActions();

      setTimeout(() => {
        document.getElementById("avatar-upload-btn")?.addEventListener("click", () => {
          document.getElementById("avatar-file")?.click();
        });

        document.getElementById("avatar-file")?.addEventListener("change", uploadAvatar);
      }, 0);

    } catch (e) {
      console.error("Error loading profile:", e);
      Router.setView("home");
    }
  }

  function showProfileActions() {
    const html =
      actionButton({ icon: "✏️", text: "Editar datos", onClick: "openEditProfileForm()" }) +
      actionButton({ icon: "🚪", text: "Cerrar sesión", onClick: "logoutUser()", danger: true });

    setActionPanel(html);
  }

  function setActionPanel(html) {
    const panel = document.getElementById("actionPanel");
    if (panel) panel.innerHTML = html;
  }

  function actionButton({ icon, text, onClick, disabled = false, danger = false }) {
    const cls = `action-btn${danger ? " danger" : ""}${disabled ? " disabled" : ""}`;
    const disAttr = disabled ? "disabled" : "";

    return `
      <button class="${cls}" type="button" ${disAttr} ${onClick ? `onclick="${onClick}"` : ""}>
        <span class="icon" aria-hidden="true">${icon}</span>
        <span class="action-text">${escapeHtml(text)}</span>
      </button>
    `;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function uploadAvatar() {
    const file = document.getElementById("avatar-file").files[0];
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

      document.getElementById("profile-avatar").src = publicUrl;
      currentProfile.avatar_url = publicUrl;
    } catch (e) {
      console.error("Error uploading avatar:", e);
      alert("Error al subir la foto: " + e.message);
    }
  }

  function openEditModal({ title, fields, onSave }) {
    let root = document.getElementById("user-modal-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "user-modal-root";
      document.body.appendChild(root);
    }

    const fieldsHtml = fields.map(f => `
      <div style="margin-bottom:10px">
        <label class="glass-modal-field-label" style="font-size:13px; margin-bottom:4px; display:block">${escapeHtml(f.label)}${f.required ? ' <span style="color:#fca5a5">*</span>' : ''}</label>
        ${f.type === "textarea"
          ? `<textarea id="usrm-${f.id}" class="glass-modal-input" rows="2" style="font-size:14px">${escapeHtml(f.value || "")}</textarea>`
          : `<input id="usrm-${f.id}" class="glass-modal-input" type="${f.type || "text"}" value="${escapeHtml(f.value || "")}" placeholder="${escapeHtml(f.placeholder || "")}" style="font-size:14px" />`
        }
      </div>
    `).join("");

    root.innerHTML = `
      <div class="glass-modal-overlay" id="usrm-overlay" role="dialog" aria-modal="true">
        <div class="glass-modal" style="width:520px;max-width:95vw">
          <div class="glass-modal-head">
            <div class="glass-modal-title">${escapeHtml(title)}</div>
            <button class="glass-modal-x" type="button" aria-label="Cerrar" onclick="closeUserModal()">✕</button>
          </div>
          <div class="glass-modal-body" style="padding:16px 20px">
            ${fieldsHtml}
            <div id="usrm-error" style="display:none;color:#fecaca;font-size:12px;margin-top:4px;background:rgba(255,80,80,.12);border:1px solid rgba(255,80,80,.25);padding:8px 12px;border-radius:8px"></div>
          </div>
          <div class="glass-modal-actions">
            <button class="ghost-btn glass-modal-cancel" type="button" onclick="closeUserModal()">Cancelar</button>
            <button class="cta glass-modal-ok" type="button" onclick="__usrSave()">💾 Guardar</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("usrm-overlay").addEventListener("click", e => {
      if (e.target.id === "usrm-overlay") closeUserModal();
    });

    window.__usrKeyDown = e => { if (e.key === "Escape") closeUserModal(); };
    document.addEventListener("keydown", window.__usrKeyDown, true);

    window.__usrSave = onSave;

    setTimeout(() => document.getElementById("usrm-overlay").focus(), 100);
  }

  window.openEditProfileForm = function() {
    openEditModal({
      title: "Editar perfil",
      fields: [
        { id: "name", label: "Nombre", type: "text", value: currentProfile.name, required: true },
        { id: "surname", label: "Apellidos", type: "text", value: currentProfile.surname },
        { id: "phone", label: "Teléfono", type: "tel", value: currentProfile.phone },
        { id: "address", label: "Dirección", type: "text", value: currentProfile.address },
        { id: "city", label: "Ciudad", type: "text", value: currentProfile.city },
        { id: "province", label: "Provincia", type: "text", value: currentProfile.province },
        { id: "postal", label: "Código Postal", type: "text", value: currentProfile.postal }
      ],
      onSave: async () => {
        const changes = {
          name: document.getElementById("usrm-name").value,
          surname: document.getElementById("usrm-surname").value,
          phone: document.getElementById("usrm-phone").value,
          address: document.getElementById("usrm-address").value,
          city: document.getElementById("usrm-city").value,
          province: document.getElementById("usrm-province").value,
          postal: document.getElementById("usrm-postal").value
        };

        if (!changes.name) {
          const errDiv = document.getElementById("usrm-error");
          errDiv.style.display = "block";
          errDiv.textContent = "El nombre es requerido";
          return;
        }

        try {
          await updateProfile(changes);
          Object.assign(currentProfile, changes);
          closeUserModal();
          renderUser();
        } catch (e) {
          const errDiv = document.getElementById("usrm-error");
          errDiv.style.display = "block";
          errDiv.textContent = e.message;
        }
      }
    });
  };

  window.logoutUser = async function() {
    try {
      if (typeof logout === "function") await logout();
      else window.location.href = "login.html";
    } catch (e) {
      console.error("Error en logout:", e);
      window.location.href = "login.html";
    }
  };

  window.closeUserModal = function() {
    const root = document.getElementById("user-modal-root");
    if (root) {
      root.innerHTML = "";
      root.remove();
    }
    document.removeEventListener("keydown", window.__usrKeyDown, true);
  };

  Router.registerView("user", renderUser);
})();
