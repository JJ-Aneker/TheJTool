/**
 * Servicio para generar y descargar diagramas Gantt
 */
export const ganttService = {
  async generateGantt(projectData) {
    try {
      const response = await fetch('/api/generate-gantt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectData
        })
      });

      if (!response.ok) {
        try {
          const error = await response.json();
          throw new Error(error.error || `HTTP ${response.status}`);
        } catch (e) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      // Descargar archivo Excel
      const blob = await response.blob();

      // Validar que sea un archivo Excel válido
      if (blob.size === 0) {
        throw new Error('El servidor devolvió un archivo vacío');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Gantt_${new Date().getTime()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (err) {
      console.error('Gantt generation error:', err);
      throw new Error(`Error generando Gantt: ${err.message}`);
    }
  }
};
