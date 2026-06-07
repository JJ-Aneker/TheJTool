/**
 * Servicio para generar y descargar diagramas Gantt
 */
export const ganttService = {
  async generateGantt(projectData, startDate = null) {
    try {
      const response = await fetch('/api/export-gantt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectData,
          startDate
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

      // Obtener nombre del archivo del header
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `Gantt_${new Date().getTime()}.xlsx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
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
