// Servicio para gestionar verticales
export const verticalesService = {
  // Obtener todos los verticales
  async getAllVerticals() {
    const response = await fetch('/api/verticales');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cargar verticales');
    }
    return response.json();
  },

  // Obtener un vertical por ID
  async getVertical(id) {
    const response = await fetch(`/api/verticales/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cargar vertical');
    }
    return response.json();
  },

  // Crear nuevo vertical
  async createVertical(data) {
    const response = await fetch('/api/verticales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear vertical');
    }
    return response.json();
  },

  // Actualizar vertical
  async updateVertical(id, data) {
    const response = await fetch(`/api/verticales/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar vertical');
    }
    return response.json();
  },

  // Eliminar vertical
  async deleteVertical(id) {
    const response = await fetch(`/api/verticales/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar vertical');
    }
    return response.json();
  }
};
