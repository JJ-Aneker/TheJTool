// Therefore Web API Service
// Handles authentication and queries to Therefore servers

import axios from 'axios'

class ThereforeService {
  constructor() {
    this.tokens = {} // Cache de tokens por URL
  }

  /**
   * Get connection token from Therefore server
   */
  async getConnectionToken(url, usuario, password) {
    try {
      const response = await axios.post(
        `${url}/GetConnectionToken`,
        {},
        {
          auth: { username: usuario, password },
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      )

      if (response.data?.Token) {
        this.tokens[url] = response.data.Token
        return response.data.Token
      }
      throw new Error('No token received from server')
    } catch (err) {
      if (err.response?.status === 401) {
        throw new Error('Credenciales inválidas. Verifica usuario y contraseña del Therefore.')
      }
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        throw new Error('Timeout: El servidor Therefore tarda demasiado en responder')
      }
      if (err.message?.includes('CORS')) {
        throw new Error('Error CORS: Puede que el servidor Therefore no permita acceso desde el navegador')
      }
      if (!url) {
        throw new Error('URL del servidor no configurada')
      }
      throw new Error(`Error de autenticación: ${err.message}`)
    }
  }

  /**
   * Execute query to count documents in a category
   */
  async getDocumentCount(url, usuario, password) {
    try {
      const token = await this.getConnectionToken(url, usuario, password)

      const response = await axios.post(
        `${url}/ExecuteSimpleQuery`,
        {
          Query: '*'
        },
        {
          auth: { username: usuario, password: token },
          headers: {
            'UseToken': '1',
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )

      return response.data?.ResultRows?.length || 0
    } catch (err) {
      console.error('Error counting documents:', err.message)
      if (err.message?.includes('403') || err.message?.includes('permission')) {
        throw new Error('Permiso denegado: El usuario no tiene permisos para consultar documentos')
      }
      return 0
    }
  }

  /**
   * Get cases from Therefore server
   */
  async getCaseCount(url, usuario, password) {
    try {
      const token = this.tokens[url] || await this.getConnectionToken(url, usuario, password)

      // ExecuteSingleQuery with Mode 5 = CaseQuery
      const response = await axios.post(
        `${url}/ExecuteSingleQuery`,
        {
          Query: '*',
          Mode: 5
        },
        {
          auth: { username: usuario, password: token },
          headers: {
            'UseToken': '1',
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )

      return response.data?.ResultRows?.length || 0
    } catch (err) {
      console.error('Error counting cases:', err.message)
      if (err.message?.includes('403') || err.message?.includes('permission')) {
        throw new Error('Permiso denegado: El usuario no tiene permisos para consultar casos')
      }
      return 0
    }
  }

  /**
   * Get users from Therefore server
   */
  async getUserCount(url, usuario, password) {
    try {
      const token = this.tokens[url] || await this.getConnectionToken(url, usuario, password)

      const response = await axios.post(
        `${url}/ExecuteUsersQuery`,
        {
          Query: '*'
        },
        {
          auth: { username: usuario, password: token },
          headers: {
            'UseToken': '1',
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )

      return response.data?.ResultRows?.length || 0
    } catch (err) {
      console.error('Error counting users:', err.message)
      if (err.message?.includes('403') || err.message?.includes('permission')) {
        throw new Error('Permiso denegado: El usuario no tiene permisos para consultar usuarios')
      }
      return 0
    }
  }

  /**
   * Get workflow instances from Therefore server
   */
  async getWorkflowCount(url, usuario, password) {
    try {
      const token = this.tokens[url] || await this.getConnectionToken(url, usuario, password)

      const response = await axios.post(
        `${url}/ExecuteWorkflowQueryForAll`,
        {},
        {
          auth: { username: usuario, password: token },
          headers: {
            'UseToken': '1',
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )

      return response.data?.ResultRows?.length || 0
    } catch (err) {
      console.error('Error counting workflows:', err.message)
      if (err.message?.includes('403') || err.message?.includes('permission')) {
        throw new Error('Permiso denegado: El usuario no tiene permisos para consultar workflows')
      }
      return 0
    }
  }

  /**
   * Extract report data from Therefore server
   */
  async extractReportData(url, usuario, password) {
    if (!url || !usuario) {
      throw new Error('URL y usuario del servidor Therefore son requeridos')
    }

    try {
      const results = await Promise.allSettled([
        this.getDocumentCount(url, usuario, password),
        this.getCaseCount(url, usuario, password),
        this.getUserCount(url, usuario, password),
        this.getWorkflowCount(url, usuario, password)
      ])

      const [docResult, caseResult, userResult, workflowResult] = results

      const reportData = {
        documentos: docResult.status === 'fulfilled' ? docResult.value : 0,
        casos: caseResult.status === 'fulfilled' ? caseResult.value : 0,
        usuarios: userResult.status === 'fulfilled' ? userResult.value : 0,
        workflows: workflowResult.status === 'fulfilled' ? workflowResult.value : 0
      }

      // If any query failed, throw the first error
      const failedResult = results.find(r => r.status === 'rejected')
      if (failedResult) {
        throw failedResult.reason
      }

      return reportData
    } catch (err) {
      throw new Error(`Error extrayendo datos: ${err.message}`)
    }
  }

  /**
   * Clear cached token for a URL
   */
  clearToken(url) {
    delete this.tokens[url]
  }
}

export const thereforeService = new ThereforeService()
