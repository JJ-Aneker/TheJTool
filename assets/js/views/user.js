(function () {
  let currentProfile = null;
  let currentUser = null;

  async function renderUser() {
    try {
      currentProfile = await getProfile();
      const { data: { user } } = await client.auth.getUser();
      currentUser = user;

      const roleLabel = { read: "Lector", write: "Editor", admin: "Administrador" }[currentProfile.role] || currentProfile.role;

      const html = `
        <section class="panel resultados" id="mainPanel">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 0.75rem;">
            <h2>Perfil de usuario</h2>
            <div style="display: flex; gap: 0.5rem;">
              <button class="action-btn" type="button" onclick="openEditProfileForm()">
                <span class="icon">✏️</span>
                <span class="action-text">Editar</span>
              </button>
              <button class="action-btn" type="button" onclick="openAvatarUpload()">
                <span class="icon">🖼️</span>
                <span class="action-text">Foto</span>
              </button>
              <button class="action-btn danger" type="button" onclick="logoutUser()">
                <span class="icon">🚪</span>
                <span class="action-text">Salir</span>
              </button>
            </div>
          </div>

          <div style="max-width: 400px;">
            <div style="background: #1F1F1F; text-align: center; padding: 1.5rem; border-radius: 6px;">
              <img src="${currentProfile.avatar_url || 'avatar.png'}" alt="Avatar" style="width: 90px; height: 90px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem; display: block; margin-left: auto; margin-right: auto;">

              <h3 style="color: rgba(238,244,255,.95); margin: 0 0 0.5rem 0; font-size: 1rem;">
                ${escapeHtml(currentProfile.name || "Usuario")}
              </h3>

              <p style="color: rgba(238,244,255,.6); margin: 0 0 0.3rem 0; font-size: 0.85rem;">
                ${escapeHtml(currentUser?.email || "—")}
              </p>

              <p style="color: #004894; margin: 0; font-size: 0.8rem; font-weight: 600;">
                ${escapeHtml(roleLabel)}
              </p>
            </div>
          </div>
        </section>
      `;

      UI.replaceWithAnimation(html);

    } catch (e) {
      console.error("Error loading profile:", e);
      Router.setView("home");
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
          : `<input id="usrm-${f.id}" class="glass-modal-input" type="${f.type || "text"}" value="${escapeHtml(f.value || "")}" placeholder="${escapeHtml(f.placeholder || "")}" style="font-size:14px" ${f.disabled ? "disabled" : ""} />`
        }
      </div>
    `).join("");

    root.innerHTML = `
      <div class="glass-modal-overlay" id="usrm-overlay" role="dialog" aria-modal="true">
        <div class="glass-modal" style="width:480px;max-width:95vw">
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
        { id: "email", label: "Email", type: "email", value: currentUser?.email || "", disabled: true },
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

  window.openAvatarUpload = function() {
    let root = document.getElementById("avatar-modal-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "avatar-modal-root";
      document.body.appendChild(root);
    }

    root.innerHTML = `
      <div class="glass-modal-overlay" id="avatar-overlay" role="dialog" aria-modal="true">
        <div class="glass-modal" style="width:400px;max-width:95vw">
          <div class="glass-modal-head">
            <div class="glass-modal-title">Cambiar foto de perfil</div>
            <button class="glass-modal-x" type="button" aria-label="Cerrar" onclick="closeAvatarModal()">✕</button>
          </div>
          <div class="glass-modal-body" style="padding:20px; text-align: center;">
            <img id="avatar-preview" src="${currentProfile.avatar_url || 'avatar.png'}" alt="Vista previa" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-bottom: 1.5rem;">
            <input type="file" id="avatar-input" accept="image/*" style="display:none">
            <button type="button" class="cta" style="width: 100%; padding: 0.75rem;" onclick="document.getElementById('avatar-input').click()">
              Seleccionar imagen
            </button>
            <p style="color: rgba(238,244,255,.5); font-size: 12px; margin-top: 1rem; margin-bottom: 0;">
              Formatos: JPG, PNG, WebP (máx 5MB)
            </p>
            <div id="avatar-error" style="display:none;color:#fecaca;font-size:12px;margin-top:1rem;background:rgba(255,80,80,.12);border:1px solid rgba(255,80,80,.25);padding:8px 12px;border-radius:8px"></div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("avatar-overlay").addEventListener("click", e => {
      if (e.target.id === "avatar-overlay") closeAvatarModal();
    });

    window.__avatarKeyDown = e => { if (e.key === "Escape") closeAvatarModal(); };
    document.addEventListener("keydown", window.__avatarKeyDown, true);

    const fileInput = document.getElementById("avatar-input");
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      if (!file) return;

      try {
        const errDiv = document.getElementById("avatar-error");
        errDiv.style.display = "none";

        const fileExt = file.name.split(".").pop();
        const filePath = `${currentUser.id}/avatar.${fileExt}`;

        const { error: uploadError } = await client.storage
          .from("avatars")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = client.storage.from("avatars").getPublicUrl(filePath);
        const publicUrl = data.publicUrl;

        await updateProfile({ avatar_url: publicUrl });

        currentProfile.avatar_url = publicUrl;
        document.getElementById("avatar-preview").src = publicUrl;

        setTimeout(() => closeAvatarModal(), 800);
      } catch (e) {
        const errDiv = document.getElementById("avatar-error");
        errDiv.style.display = "block";
        errDiv.textContent = "Error: " + e.message;
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

  window.closeAvatarModal = function() {
    const root = document.getElementById("avatar-modal-root");
    if (root) {
      root.innerHTML = "";
      root.remove();
    }
    document.removeEventListener("keydown", window.__avatarKeyDown, true);
  };

  Router.registerView("user", renderUser);
})();
