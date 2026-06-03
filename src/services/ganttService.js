/**
 * Servicio para generar y descargar diagramas Gantt
 */
export const ganttService = {
  async generateGantt(projectDescription, vertical = 'General') {
    try {
      const response = await fetch('/api/generate-gantt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectDescription,
          vertical
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error generating Gantt');
      }

      // Descargar archivo Excel
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Gantt_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (err) {
      throw new Error(`Error: ${err.message}`);
    }
  }
};
