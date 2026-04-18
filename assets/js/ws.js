/* ============================================================
   WEBSERVICES – Gestión completa TheJ ToolBox
============================================================ */

let selectedServerId = null;

/* ============================================================
   HELPERS UI (Panel de acciones)
============================================================ */

function setActionPanel(html) {
  const panel = document.getElementById("actionPanel");
  if (!panel) return;
  panel.innerHTML = html;
}

function actionButton({ icon, text, onClick, disabled = false, danger = false, title = "" }) {
  const cls = `action-btn${danger ? " danger" : ""}${disabled ? " disabled" : ""}`;
  const disAttr = disabled ? "disabled" : "";
  const safeTitle = title ? `title="${escapeHtml(title)}"` : "";

  return `
    <button class="${cls}" type="button" ${disAttr} ${safeTitle} ${onClick ? `onclick="${onClick}"` : ""}>
      <span class="icon" aria-hidden="true">${icon}</span>
      <span class="action-text">${escapeHtml(text)}</span>
    </button>
  `;
}

function sectionTitle(title) {
  return `<h3 class="actions-title">${escapeHtml(title)}</h3>`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ============================================================
   LISTAR SERVIDORES
============================================================ */

async function loadWebServiceList() {
  const { data: servers, error } = await client
    .from("web_services")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando servidores:", error);
    return;
  }

  let rows = "";
  (servers || []).forEach((s) => {
    rows += `
      <tr class="ws-row" data-id="${s.id}">
        <td>${escapeHtml(s.url_base)}</td>
        <td>${escapeHtml(s.tenant_name || "-")}</td>
        <td>${escapeHtml(s.username)}</td>
        <td>${new Date(s.created_at).toLocaleDateString()}</td>
      </tr>
    `;
  });

  const html = `
    <section class="panel resultados" id="mainPanel">
      <h2>Servidores Web</h2>

      <div class="table-wrapper">
        <table class="glass-table">
          <thead>
            <tr>
              <th>URL Base</th>
              <th>Tenant</th>
              <th>Usuario</th>
              <th>Creación</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </section>
  `;

  if (typeof replaceWithAnimation === "function") {
    replaceWithAnimation(html);
  } else {
    const main = document.getElementById("mainPanel");
    if (main) main.outerHTML = html;
  }

  setTimeout(() => {
    document.querySelectorAll(".ws-row").forEach((row) => {
      row.addEventListener("click", () => selectServer(row.dataset.id));
    });
  }, 50);

  showNoSelectionActions();
}

/* ============================================================
   SELECCIÓN DE FILA
============================================================ */

function selectServer(id) {
  selectedServerId = id;

  document.querySelectorAll(".ws-row").forEach((r) => r.classList.remove("selected"));

  // ✅ sin CSS.escape para evitar problemas de compatibilidad
  const target = document.querySelector(`.ws-row[data-id="${id}"]`);
  if (target) target.classList.add("selected");

  showActionsForSelected();
}

/* ============================================================
   PANEL LATERAL: ACCIONES SIN SELECCIÓN
============================================================ */

function showNoSelectionActions() {
  const html =
    actionButton({ icon: "➕", text: "Añadir servidor", onClick: "openNewServerForm()" }) +
    actionButton({ icon: "✏️", text: "Editar (selecciona uno)", disabled: true }) +
    actionButton({ icon: "🧪", text: "Probar (selecciona uno)", disabled: true }) +
    actionButton({ icon: "🗑️", text: "Eliminar (selecciona uno)", disabled: true, danger: true });

  setActionPanel(html);
}

/* ============================================================
   PANEL LATERAL: ACCIONES CON SELECCIÓN
============================================================ */

function showActionsForSelected() {
  const html =
    actionButton({ icon: "✏️", text: "Editar servidor", onClick: "openEditServer()" }) +
    actionButton({ icon: "🧪", text: "Probar conexión", onClick: "testServer()" }) +
    actionButton({ icon: "🗑️", text: "Eliminar", onClick: "deleteServer()", danger: true }) +
    actionButton({ icon: "➕", text: "Nuevo servidor", onClick: "openNewServerForm()" });

  setActionPanel(html);
}

/* ============================================================
   MODAL HELPER
============================================================ */

function openServerModal({ title, fields, onSave, onCancel }) {
  let root = document.getElementById("ui-modal-root");
  if (!root) { root = document.createElement("div"); root.id = "ui-modal-root"; document.body.appendChild(root); }

  const fieldsHtml = fields.map(f => `
    <div style="margin-bottom:14px">
      <label class="glass-modal-field-label">${escapeHtml(f.label)}${f.required ? ' <span style="color:#fca5a5">*</span>' : ''}</label>
      ${f.type === "textarea"
        ? `<textarea id="wsm-${f.id}" class="glass-modal-input" rows="3">${escapeHtml(f.value || "")}</textarea>`
        : `<input id="wsm-${f.id}" class="glass-modal-input" type="${f.type || "text"}" value="${escapeHtml(f.value || "")}" placeholder="${escapeHtml(f.placeholder || "")}" />`
      }
    </div>
  `).join("");

  root.innerHTML = `
    <div class="glass-modal-overlay" id="wsm-overlay" role="dialog" aria-modal="true">
      <div class="glass-modal" style="width:480px;max-width:95vw">
        <div class="glass-modal-head">
          <div class="glass-modal-title">${escapeHtml(title)}</div>
          <button class="glass-modal-x" type="button" aria-label="Cerrar" onclick="closeServerModal()">✕</button>
        </div>
        <div class="glass-modal-body" style="padding:20px 24px">
          ${fieldsHtml}
          <div id="wsm-error" style="display:none;color:#fecaca;font-size:12px;margin-top:4px;background:rgba(255,80,80,.12);border:1px solid rgba(255,80,80,.25);padding:8px 12px;border-radius:8px"></div>
        </div>
        <div class="glass-modal-actions">
          <button class="ghost-btn glass-modal-cancel" type="button" onclick="closeServerModal()">Cancelar</button>
          <button class="cta glass-modal-ok" type="button" onclick="__wsmSave()">💾 Guardar</button>
        </div>
      </div>
    </div>
  `;

  // Cerrar al hacer click fuera
  document.getElementById("wsm-overlay").addEventListener("click", e => {
    if (e.target.id === "wsm-overlay") closeServerModal();
  });

  // Cerrar con Escape
  window.__wsmKeyDown = e => { if (e.key === "Escape") closeServerModal(); };
  document.addEventListener("keydown", window.__wsmKeyDown, true);

  window.__wsmSave = onSave;

  // Foco en el primer input
  setTimeout(() => root.querySelector(".glass-modal-input")?.focus(), 50);
}

function closeServerModal() {
  const root = document.getElementById("ui-modal-root");
  if (root) root.innerHTML = "";
  document.removeEventListener("keydown", window.__wsmKeyDown, true);
}

function showModalError(msg) {
  const el = document.getElementById("wsm-error");
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
}

function getModalValue(id) {
  return document.getElementById(`wsm-${id}`)?.value?.trim() || "";
}

/* ============================================================
   NUEVO SERVIDOR
============================================================ */

function openNewServerForm() {
  selectedServerId = null;

  openServerModal({
    title: "Nuevo servidor",
    fields: [
      { id: "url",    label: "URL Base",       type: "text",     required: true,  placeholder: "https://..." },
      { id: "tenant", label: "Tenant",          type: "text",     required: false, placeholder: "" },
      { id: "user",   label: "Usuario",         type: "text",     required: true,  placeholder: "" },
      { id: "pass",   label: "Password",        type: "password", required: false, placeholder: "" },
      { id: "observ", label: "Observaciones",   type: "textarea", required: false },
    ],
    onSave: saveNewServer,
  });
}

async function saveNewServer() {
  const payload = {
    url_base:      getModalValue("url"),
    tenant_name:   getModalValue("tenant"),
    username:      getModalValue("user"),
    password:      getModalValue("pass"),
    observaciones: getModalValue("observ"),
  };

  if (!payload.url_base || !payload.username) {
    showModalError("URL Base y Usuario son obligatorios.");
    return;
  }

  const { error } = await client.from("web_services").insert([payload]);
  if (error) { showModalError("Error guardando servidor: " + error.message); return; }

  closeServerModal();
  loadWebServiceList();
}

/* ============================================================
   EDITAR SERVIDOR
============================================================ */

async function openEditServer() {
  if (!selectedServerId) return;

  const { data: s, error } = await client
    .from("web_services")
    .select("*")
    .eq("id", selectedServerId)
    .single();

  if (error || !s) { console.error(error); return; }

  openServerModal({
    title: "Editar servidor",
    fields: [
      { id: "url",    label: "URL Base",     type: "text",     required: true,  value: s.url_base,         placeholder: "https://..." },
      { id: "tenant", label: "Tenant",        type: "text",     required: false, value: s.tenant_name || "" },
      { id: "user",   label: "Usuario",       type: "text",     required: true,  value: s.username },
      { id: "pass",   label: "Password",      type: "password", required: false, value: s.password || "" },
      { id: "observ", label: "Observaciones", type: "textarea", required: false, value: s.observaciones || "" },
    ],
    onSave: () => saveEditServer(s.id),
  });
}

async function saveEditServer(id) {
  const payload = {
    url_base:      getModalValue("url"),
    tenant_name:   getModalValue("tenant"),
    username:      getModalValue("user"),
    password:      getModalValue("pass"),
    observaciones: getModalValue("observ"),
    updated_at:    new Date().toISOString(),
  };

  if (!payload.url_base || !payload.username) {
    showModalError("URL Base y Usuario son obligatorios.");
    return;
  }

  const { error } = await client.from("web_services").update(payload).eq("id", id);
  if (error) { showModalError("Error actualizando servidor: " + error.message); return; }

  closeServerModal();
  loadWebServiceList();
}

/* ============================================================
   ELIMINAR SERVIDOR
============================================================ */

async function deleteServer() {
  if (!selectedServerId) return;
  if (!confirm("¿Eliminar este servidor?")) return;

  const { error } = await client.from("web_services").delete().eq("id", selectedServerId);

  if (error) {
    console.error(error);
    alert("Error eliminando servidor.");
    return;
  }

  alert("Servidor eliminado ✔");
  selectedServerId = null;
  loadWebServiceList();
}

/* ============================================================
   PROBAR SERVIDOR
============================================================ */

function testServer() {
  if (!selectedServerId) {
    alert("Selecciona un servidor primero.");
    return;
  }
  alert("Función de test pendiente.");
}