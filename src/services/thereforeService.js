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
          headers: { 'Content-Type': 'application/json' }
        }
      )

      if (response.data?.Token) {
        this.tokens[url] = response.data.Token
        return response.data.Token
      }
      throw new Error('No token received from server')
    } catch (err) {
      if (err.response?.status === 401) {
        throw new Error('Credenciales inválidas')
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
          }
        }
      )

      return response.data?.ResultRows?.length || 0
    } catch (err) {
      console.error('Error counting documents:', err.message)
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
          }
        }
      )

      return response.data?.ResultRows?.length || 0
    } catch (err) {
      console.error('Error counting cases:', err.message)
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
          }
        }
      )

      return response.data?.ResultRows?.length || 0
    } catch (err) {
      console.error('Error counting users:', err.message)
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
          }
        }
      )

      return response.data?.ResultRows?.length || 0
    } catch (err) {
      console.error('Error counting workflows:', err.message)
      return 0
    }
  }

  /**
   * Extract report data from Therefore server
   */
  async extractReportData(url, usuario, password) {
    try {
      const [documentos, casos, usuarios, workflows] = await Promise.all([
        this.getDocumentCount(url, usuario, password),
        this.getCaseCount(url, usuario, password),
        this.getUserCount(url, usuario, password),
        this.getWorkflowCount(url, usuario, password)
      ])

      return {
        documentos,
        casos,
        usuarios,
        workflows
      }
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
