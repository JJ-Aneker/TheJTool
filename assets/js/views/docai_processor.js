// ===============================
// views/docai_processor.js – DocAI Processor
// ===============================

(function () {
  async function renderDocAIProcessor() {

    const html = `
      <section class="panel resultados" id="mainPanel">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 0 1rem 0; border-bottom: 1px solid rgba(40,215,199,.15); margin-bottom: 1rem;">
          <div class="page-header" style="margin: 0; flex: 1;">
            <div class="page-header-content" style="margin: 0;">
              <h2 style="margin: 0; font-size: 1.5rem;">DocAI Processor</h2>
            </div>
          </div>
          <div style="display: flex; gap: 0.6rem;">
            <button class="action-card" id="docai-process-btn" type="button">
              <span class="icon">⚙️</span>
              <span class="action-text">Procesar</span>
            </button>
            <button class="action-card" id="docai-clear-btn" type="button">
              <span class="icon">🗑️</span>
              <span class="action-text">Limpiar</span>
            </button>
          </div>
        </div>

        <div class="content-card">
          <h3>Procesamiento de Documentos</h3>
          <p>
            Utiliza DocAI Processor para analizar, extraer datos y procesar documentos automáticamente.
          </p>

          <div style="margin-top: 20px;">
            <label for="docai-file" style="display: block; margin-bottom: 10px;">
              <strong>Selecciona un documento:</strong>
            </label>
            <input type="file" id="docai-file" accept=".pdf,.jpg,.png,.docx" style="margin-bottom: 15px;" />

            <label for="docai-processor-type" style="display: block; margin-bottom: 10px;">
              <strong>Tipo de procesamiento:</strong>
            </label>
            <select id="docai-processor-type" style="margin-bottom: 15px; padding: 8px; border-radius: 4px; border: 1px solid #ccc;">
              <option value="extract">Extracción de datos</option>
              <option value="classify">Clasificación</option>
              <option value="analyze">Análisis</option>
            </select>
          </div>
        </div>

        <div id="docai-results" style="margin-top: 20px; display: none;">
          <h3>Resultados</h3>
          <pre id="docai-output" style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-auto;"></pre>
        </div>
      </section>
    `;

    UI.replaceWithAnimation(html);

    requestAnimationFrame(() => {
      document.getElementById("docai-process-btn")?.addEventListener("click", processDocument);
      document.getElementById("docai-clear-btn")?.addEventListener("click", clearResults);
    });
  }

  async function processDocument() {
    const fileInput = document.getElementById("docai-file");
    const processorType = document.getElementById("docai-processor-type")?.value || "extract";

    if (!fileInput?.files[0]) {
      alert("Por favor selecciona un documento");
      return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("processorType", processorType);

    try {
      const response = await fetch("/api/docai/process", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      displayResults(result);
    } catch (error) {
      console.error("Error procesando documento:", error);
      alert(`Error: ${error.message}`);
    }
  }

  function displayResults(data) {
    const resultsDiv = document.getElementById("docai-results");
    const outputDiv = document.getElementById("docai-output");

    if (outputDiv) {
      outputDiv.textContent = JSON.stringify(data, null, 2);
    }

    if (resultsDiv) {
      resultsDiv.style.display = "block";
    }
  }

  function clearResults() {
    const fileInput = document.getElementById("docai-file");
    const resultsDiv = document.getElementById("docai-results");

    if (fileInput) {
      fileInput.value = "";
    }

    if (resultsDiv) {
      resultsDiv.style.display = "none";
    }
  }

  Router.registerView("docai_processor", renderDocAIProcessor);
})();
