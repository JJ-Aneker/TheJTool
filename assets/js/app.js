// ===============================
// app.js – bootstrap (mínimo)
// ===============================

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Load user auth data
    if (typeof requireAuth === "function") {
      const user = await requireAuth();
      if (!user) return;
      window.__user = user;
      console.log("User authenticated:", user.email);
    }

    // Load user profile data
    if (typeof getProfile === "function") {
      const profile = await getProfile();
      window.__profile = profile;
      console.log("Profile loaded:", profile.name, profile.role);

      // Update user button in topbar
      if (profile) {
        const roleLabel = { read: "Lector", write: "Editor", admin: "Administrador" }[profile.role] || profile.role;
        document.getElementById("userName").textContent = profile.name || "Usuario";
        document.getElementById("userRole").textContent = roleLabel || "Rol";

        if (profile.avatar_url) {
          const avatar = document.getElementById("userAvatar");
          avatar.src = profile.avatar_url;
          avatar.style.display = "";
        }
      }

      // Show admin button if admin role
      if (profile && profile.role === "admin") {
        const btnAdmin = document.getElementById("btnAdmin");
        if (btnAdmin) btnAdmin.style.display = "";
      }
    }
  } catch (e) {
    console.error("Error en requireAuth:", e);
    return;
  }

  UI.initToggles();
  initNavigation();

  Router.setView("home");
});

function initNavigation() {
  const btnHome      = document.getElementById("btnHome");
  const btnUser      = document.getElementById("btnUser");
  const btnWS        = document.getElementById("btnWS");
  const btnSearch    = document.getElementById("btnSearch");
  const btnDocs      = document.getElementById("btnDocs");
  const btnTherefore          = document.getElementById("btnTherefore");
  const btnEForms             = document.getElementById("btnEForms");
  const btnCategoryReplicator = document.getElementById("btnCategoryReplicator");
  const btnDocAIProcessor      = document.getElementById("btnDocAIProcessor");
  const btnAgents             = document.getElementById("btnAgents");
  const btnDocGenerator       = document.getElementById("btnDocGenerator");
  const btnQuoter             = document.getElementById("btnQuoter");
  const btnAdmin              = document.getElementById("btnAdmin");
  const btnLogout             = document.getElementById("btnLogout");

  btnHome?.addEventListener("click", () => Router.setView("home"));
  btnUser?.addEventListener("click", () => openUserModal());
  btnWS?.addEventListener("click", () => Router.setView("ws"));
  btnSearch?.addEventListener("click", () => Router.setView("search"));
  btnDocs?.addEventListener("click", () => Router.setView("docs"));
  btnTherefore?.addEventListener("click", () => Router.setView("therefore"));
  btnEForms?.addEventListener("click", () => Router.setView("eforms"));
  btnCategoryReplicator?.addEventListener("click", () => Router.setView("categoryReplicator"));
  btnDocAIProcessor?.addEventListener("click", () => Router.setView("docai_processor"));
  btnAgents?.addEventListener("click", () => Router.setView("agents"));
  btnDocGenerator?.addEventListener("click", () => Router.setView("docGenerator"));
  btnQuoter?.addEventListener("click", () => Router.setView("quoter"));
  btnAdmin?.addEventListener("click", () => Router.setView("admin"));

  btnLogout?.addEventListener("click", async () => {
    try {
      if (typeof logout === "function") await logout();
      else window.location.href = "login.html";
    } catch (e) {
      console.error("Error en logout:", e);
      window.location.href = "login.html";
    }
  });

  UI.updateActionPanel("");
}

// User modal functions
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openUserModal() {
  const profile = window.__profile;
  const user = window.__user;

  if (!profile || !user) return;

  let root = document.getElementById("user-topbar-modal");
  if (!root) {
    root = document.createElement("div");
    root.id = "user-topbar-modal";
    document.body.appendChild(root);
  }

  const roleLabel = { read: "Lector", write: "Editor", admin: "Administrador" }[profile.role] || profile.role;

  root.innerHTML = `
    <div class="glass-modal-overlay" id="user-overlay" role="dialog" aria-modal="true">
      <div class="glass-modal" style="width:480px;max-width:95vw">
        <div class="glass-modal-head">
          <div class="glass-modal-title">Mi perfil</div>
          <button class="glass-modal-x" type="button" aria-label="Cerrar" onclick="closeUserTopbarModal()">✕</button>
        </div>
        <div class="glass-modal-body" style="padding:24px; display:flex; flex-direction:column; gap:1.5rem;">
          <div style="display:flex; gap:1.5rem; align-items:flex-start;">
            <img src="${profile.avatar_url || 'avatar.png'}" alt="Avatar" style="width: 120px; height: 120px; border-radius: 50%; border: 2px solid #81A2D1; object-fit: cover; flex-shrink:0;">
            <div style="flex:1; text-align:left;">
              <h3 style="color: rgba(238,244,255,.95); margin: 0 0 0.25rem 0; font-size: 1.1rem; font-weight: 500;">
                ${escapeHtml(profile.name || "Usuario")}
              </h3>
              <p style="color: rgba(238,244,255,.6); margin: 0 0 0.25rem 0; font-size: 0.8rem;">
                ${escapeHtml(user.email || "—")}
              </p>
              <p style="color: #81A2D1; margin: 0.5rem 0 0 0; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">
                ${escapeHtml(roleLabel)}
              </p>
            </div>
          </div>

          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <button type="button" style="flex:1; min-width:90px; padding: 0.65rem 1.2rem; background: linear-gradient(135deg, rgba(129,162,209,0.3) 0%, rgba(129,162,209,0.15) 100%); border: 1px solid rgba(129,162,209,0.4); border-radius: 12px; color: #81A2D1; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.2);" onmouseover="this.style.cssText='flex:1;min-width:90px;padding:0.65rem 1.2rem;background:linear-gradient(135deg,rgba(129,162,209,0.4) 0%,rgba(129,162,209,0.25) 100%);border:1px solid rgba(129,162,209,0.6);border-radius:12px;color:#81A2D1;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 12px rgba(129,162,209,0.2);transform:translateY(-2px)'" onmouseout="this.style.cssText='flex:1;min-width:90px;padding:0.65rem 1.2rem;background:linear-gradient(135deg,rgba(129,162,209,0.3) 0%,rgba(129,162,209,0.15) 100%);border:1px solid rgba(129,162,209,0.4);border-radius:12px;color:#81A2D1;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.2s;box-shadow:0 2px 8px rgba(0,0,0,0.2)'" onclick="openEditProfileFormTopbar()">
              ✏️ Editar
            </button>

            <button type="button" style="flex:1; min-width:90px; padding: 0.65rem 1.2rem; background: linear-gradient(135deg, rgba(129,162,209,0.3) 0%, rgba(129,162,209,0.15) 100%); border: 1px solid rgba(129,162,209,0.4); border-radius: 12px; color: #81A2D1; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.2);" onmouseover="this.style.cssText='flex:1;min-width:90px;padding:0.65rem 1.2rem;background:linear-gradient(135deg,rgba(129,162,209,0.4) 0%,rgba(129,162,209,0.25) 100%);border:1px solid rgba(129,162,209,0.6);border-radius:12px;color:#81A2D1;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 12px rgba(129,162,209,0.2);transform:translateY(-2px)'" onmouseout="this.style.cssText='flex:1;min-width:90px;padding:0.65rem 1.2rem;background:linear-gradient(135deg,rgba(129,162,209,0.3) 0%,rgba(129,162,209,0.15) 100%);border:1px solid rgba(129,162,209,0.4);border-radius:12px;color:#81A2D1;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.2s;box-shadow:0 2px 8px rgba(0,0,0,0.2)'" onclick="openAvatarUploadTopbar()">
              🖼️ Foto
            </button>

            <button type="button" style="flex:1; min-width:90px; padding: 0.65rem 1.2rem; background: linear-gradient(135deg, rgba(212,76,76,0.3) 0%, rgba(212,76,76,0.15) 100%); border: 1px solid rgba(212,76,76,0.4); border-radius: 12px; color: #d44; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.2);" onmouseover="this.style.cssText='flex:1;min-width:90px;padding:0.65rem 1.2rem;background:linear-gradient(135deg,rgba(212,76,76,0.4) 0%,rgba(212,76,76,0.25) 100%);border:1px solid rgba(212,76,76,0.6);border-radius:12px;color:#d44;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 12px rgba(212,76,76,0.2);transform:translateY(-2px)'" onmouseout="this.style.cssText='flex:1;min-width:90px;padding:0.65rem 1.2rem;background:linear-gradient(135deg,rgba(212,76,76,0.3) 0%,rgba(212,76,76,0.15) 100%);border:1px solid rgba(212,76,76,0.4);border-radius:12px;color:#d44;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.2s;box-shadow:0 2px 8px rgba(0,0,0,0.2)'" onclick="logoutFromTopbar()">
              🚪 Salir
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("user-overlay").addEventListener("click", e => {
    if (e.target.id === "user-overlay") closeUserTopbarModal();
  });

  window.__userKeyDown = e => { if (e.key === "Escape") closeUserTopbarModal(); };
  document.addEventListener("keydown", window.__userKeyDown, true);
}

window.closeUserTopbarModal = function() {
  const root = document.getElementById("user-topbar-modal");
  if (root) {
    root.innerHTML = "";
    root.remove();
  }
  document.removeEventListener("keydown", window.__userKeyDown, true);
};

window.openEditProfileFormTopbar = function() {
  closeUserTopbarModal();

  const profile = window.__profile;
  if (!profile) return;

  let root = document.getElementById("edit-modal-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "edit-modal-root";
    document.body.appendChild(root);
  }

  const fieldsHtml = [
    { id: "name", label: "Nombre", type: "text", value: profile.name, required: true },
    { id: "surname", label: "Apellidos", type: "text", value: profile.surname },
    { id: "email", label: "Email", type: "email", value: window.__user?.email || "", disabled: true },
    { id: "phone", label: "Teléfono", type: "tel", value: profile.phone },
    { id: "address", label: "Dirección", type: "text", value: profile.address },
    { id: "city", label: "Ciudad", type: "text", value: profile.city },
    { id: "province", label: "Provincia", type: "text", value: profile.province },
    { id: "postal", label: "Código Postal", type: "text", value: profile.postal }
  ].map(f => `
    <div style="margin-bottom:10px">
      <label class="glass-modal-field-label" style="font-size:13px; margin-bottom:4px; display:block">${escapeHtml(f.label)}${f.required ? ' <span style="color:#fca5a5">*</span>' : ''}</label>
      <input id="edt-${f.id}" class="glass-modal-input" type="${f.type || "text"}" value="${escapeHtml(f.value || "")}" placeholder="${escapeHtml(f.label)}" style="font-size:14px" ${f.disabled ? "disabled" : ""} />
    </div>
  `).join("");

  root.innerHTML = `
    <div class="glass-modal-overlay" id="edit-overlay" role="dialog" aria-modal="true">
      <div class="glass-modal" style="width:480px;max-width:95vw">
        <div class="glass-modal-head">
          <div class="glass-modal-title">Editar perfil</div>
          <button class="glass-modal-x" type="button" aria-label="Cerrar" onclick="closeEditModalTopbar()">✕</button>
        </div>
        <div class="glass-modal-body" style="padding:16px 20px">
          ${fieldsHtml}
          <div id="edit-error" style="display:none;color:#fecaca;font-size:12px;margin-top:4px;background:rgba(255,80,80,.12);border:1px solid rgba(255,80,80,.25);padding:8px 12px;border-radius:8px"></div>
        </div>
        <div class="glass-modal-actions">
          <button class="ghost-btn glass-modal-cancel" type="button" onclick="closeEditModalTopbar()">Cancelar</button>
          <button class="cta glass-modal-ok" type="button" onclick="saveEditProfileTopbar()">💾 Guardar</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("edit-overlay").addEventListener("click", e => {
    if (e.target.id === "edit-overlay") closeEditModalTopbar();
  });

  window.__editKeyDown = e => { if (e.key === "Escape") closeEditModalTopbar(); };
  document.addEventListener("keydown", window.__editKeyDown, true);
};

window.closeEditModalTopbar = function() {
  const root = document.getElementById("edit-modal-root");
  if (root) {
    root.innerHTML = "";
    root.remove();
  }
  document.removeEventListener("keydown", window.__editKeyDown, true);
};

window.saveEditProfileTopbar = async function() {
  const changes = {
    name: document.getElementById("edt-name").value,
    surname: document.getElementById("edt-surname").value,
    phone: document.getElementById("edt-phone").value,
    address: document.getElementById("edt-address").value,
    city: document.getElementById("edt-city").value,
    province: document.getElementById("edt-province").value,
    postal: document.getElementById("edt-postal").value
  };

  if (!changes.name) {
    const errDiv = document.getElementById("edit-error");
    errDiv.style.display = "block";
    errDiv.textContent = "El nombre es requerido";
    return;
  }

  try {
    await updateProfile(changes);
    Object.assign(window.__profile, changes);
    closeEditModalTopbar();

    // Update topbar
    document.getElementById("userName").textContent = changes.name || "Usuario";
  } catch (e) {
    const errDiv = document.getElementById("edit-error");
    errDiv.style.display = "block";
    errDiv.textContent = e.message;
  }
};

window.openAvatarUploadTopbar = function() {
  closeUserTopbarModal();

  const profile = window.__profile;
  if (!profile) return;

  let root = document.getElementById("avatar-topbar-modal");
  if (!root) {
    root = document.createElement("div");
    root.id = "avatar-topbar-modal";
    document.body.appendChild(root);
  }

  root.innerHTML = `
    <div class="glass-modal-overlay" id="avatar-overlay" role="dialog" aria-modal="true">
      <div class="glass-modal" style="width:380px;max-width:95vw">
        <div class="glass-modal-head">
          <div class="glass-modal-title">Cambiar foto de perfil</div>
          <button class="glass-modal-x" type="button" aria-label="Cerrar" onclick="closeAvatarUploadTopbar()">✕</button>
        </div>
        <div class="glass-modal-body" style="padding:20px; text-align: center;">
          <img id="avatar-preview-topbar" src="${profile.avatar_url || 'avatar.png'}" alt="Vista previa" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 1.5rem;">
          <input type="file" id="avatar-input-topbar" accept="image/*" style="display:none">
          <button type="button" class="cta" style="width: 100%; padding: 0.75rem;" onclick="document.getElementById('avatar-input-topbar').click()">
            Seleccionar imagen
          </button>
          <p style="color: rgba(238,244,255,.5); font-size: 12px; margin-top: 1rem; margin-bottom: 0;">
            Formatos: JPG, PNG, WebP (máx 5MB)
          </p>
          <div id="avatar-error-topbar" style="display:none;color:#fecaca;font-size:12px;margin-top:1rem;background:rgba(255,80,80,.12);border:1px solid rgba(255,80,80,.25);padding:8px 12px;border-radius:8px"></div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("avatar-overlay").addEventListener("click", e => {
    if (e.target.id === "avatar-overlay") closeAvatarUploadTopbar();
  });

  window.__avatarKeyDown = e => { if (e.key === "Escape") closeAvatarUploadTopbar(); };
  document.addEventListener("keydown", window.__avatarKeyDown, true);

  const fileInput = document.getElementById("avatar-input-topbar");
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    try {
      const errDiv = document.getElementById("avatar-error-topbar");
      errDiv.style.display = "none";

      const fileExt = file.name.split(".").pop();
      const filePath = `${window.__user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await client.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = client.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      await updateProfile({ avatar_url: publicUrl });

      window.__profile.avatar_url = publicUrl;
      document.getElementById("avatar-preview-topbar").src = publicUrl;
      document.getElementById("userAvatar").src = publicUrl;

      setTimeout(() => closeAvatarUploadTopbar(), 800);
    } catch (e) {
      const errDiv = document.getElementById("avatar-error-topbar");
      errDiv.style.display = "block";
      errDiv.textContent = "Error: " + e.message;
    }
  });
};

window.closeAvatarUploadTopbar = function() {
  const root = document.getElementById("avatar-topbar-modal");
  if (root) {
    root.innerHTML = "";
    root.remove();
  }
  document.removeEventListener("keydown", window.__avatarKeyDown, true);
};

window.logoutFromTopbar = async function() {
  try {
    if (typeof logout === "function") await logout();
    else window.location.href = "login.html";
  } catch (e) {
    console.error("Error en logout:", e);
    window.location.href = "login.html";
  }
};