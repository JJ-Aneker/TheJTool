// ===============================
// views/docai_processor.js – DocAI Processor
// ===============================

(function () {
  async function renderDocAIProcessor() {

    const html = `
      <section class="panel resultados" id="mainPanel">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem;">
          <div style="flex-shrink: 0;">
            <h2 style="margin: 0 0 0.2rem 0;">DocAI Processor</h2>
            <p style="margin: 0; font-size: 0.8rem; color: rgba(238,244,255,.5);">Procesa y analiza documentos con inteligencia artificial</p>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
            <button class="action-btn" id="docai-process-btn" type="button">
              <span class="icon">⚙️</span>
              <span class="action-text">Procesar</span>
            </button>
            <button class="action-btn" id="docai-clear-btn" type="button">
              <span class="icon">🗑️</span>
              <span class="action-text">Limpiar</span>
            </button>
          </div>
        </div>

        <div style="background: #1F1F1F; padding: 1rem; border-radius: 6px; margin-bottom: 0.75rem;">
          <h3 style="margin: 0 0 0.5rem 0; color: #004894;">Procesamiento de Documentos</h3>
          <p style="margin: 0 0 0.75rem 0; font-size: 0.9rem;">
            Utiliza DocAI Processor para analizar, extraer datos y procesar documentos automáticamente.
          </p>

          <div>
            <label for="docai-file" style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 500;">
              Selecciona un documento:
            </label>
            <input type="file" id="docai-file" accept=".pdf,.jpg,.png,.docx" style="margin-bottom: 0.75rem; padding: 0.35rem 0.65rem; border: 1.5px solid #004894; border-radius: 5px; background: #0f1115; color: #e6e7eb; font-size: 12px;" />

            <label for="docai-processor-type" style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 500;">
              Tipo de procesamiento:
            </label>
            <select id="docai-processor-type" style="margin-bottom: 0; padding: 0.35rem 0.65rem; border-radius: 5px; border: 1.5px solid #004894; background: #0f1115; color: #e6e7eb; font-size: 12px;">
              <option value="extract">Extracción de datos</option>
              <option value="classify">Clasificación</option>
              <option value="analyze">Análisis</option>
            </select>
          </div>
        </div>

        <div id="docai-results" style="background: #1F1F1F; padding: 1rem; border-radius: 6px; display: none;">
          <h3 style="margin: 0 0 0.75rem 0; color: #004894;">Resultados</h3>
          <pre id="docai-output" style="background: #0f1115; padding: 0.75rem; border-radius: 4px; overflow-auto; margin: 0; font-size: 0.8rem;"></pre>
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
