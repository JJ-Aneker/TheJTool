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
  const btnAdmin              = document.getElementById("btnAdmin");
  const btnLogout             = document.getElementById("btnLogout");

  btnHome?.addEventListener("click", () => Router.setView("home"));
  btnUser?.addEventListener("click", () => Router.setView("user"));
  btnWS?.addEventListener("click", () => Router.setView("ws"));
  btnSearch?.addEventListener("click", () => Router.setView("search"));
  btnDocs?.addEventListener("click", () => Router.setView("docs"));
  btnTherefore?.addEventListener("click", () => Router.setView("therefore"));
  btnEForms?.addEventListener("click", () => Router.setView("eforms"));
  btnCategoryReplicator?.addEventListener("click", () => Router.setView("categoryReplicator"));
  btnDocAIProcessor?.addEventListener("click", () => Router.setView("docai_processor"));
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