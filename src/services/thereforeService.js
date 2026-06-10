// Therefore Web API Service
// Handles authentication and queries to Therefore servers

import axios from 'axios'
import { logger } from '../utils/logger'

class ThereforeService {
  constructor() {
    this.tokens = {} // Cache de tokens por URL
  }

  // ═══════════════════════════════════════════════════════════
  // LEGACY METHODS (metric extraction)
  // ═══════════════════════════════════════════════════════════

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
      logger.error('Error counting documents:', err.message)
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
      logger.error('Error counting cases:', err.message)
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
      logger.error('Error counting users:', err.message)
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
      logger.error('Error counting workflows:', err.message)
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

  // ═══════════════════════════════════════════════════════════
  // NEW METHODS (multi-category profile creation & execution)
  // ═══════════════════════════════════════════════════════════

  /**
   * Helper: Build Therefore API base URL
   */
  buildBaseUrl(tenantUrl) {
    return tenantUrl.replace(/\/$/, '') + '/theservice/v0001/restun'
  }

  /**
   * NEW: Connect to Therefore server and get auth headers + token
   * Used for profile creation/editing workflow
   * @param {string} tenantUrl - Base URL of the Therefore instance
   * @param {string} usuario - Username
   * @param {string} password - Password
   * @param {string|boolean} tenantNameOrIsOnPrem - TenantName (string) or isOnPremise flag (boolean)
   */
  async connect(tenantUrl, usuario, password, tenantNameOrIsOnPrem = '') {
    // Clean up credentials (trim whitespace)
    tenantUrl = tenantUrl?.trim()
    usuario = usuario?.trim()
    password = password?.trim()

    if (!tenantUrl || !usuario || !password) {
      throw new Error('URL, usuario y contraseña son requeridos')
    }

    const url = this.buildBaseUrl(tenantUrl)
    const basicHeaders = {
      Authorization: 'Basic ' + btoa(usuario + ':' + password),
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }

    // Handle both legacy (tenantName string) and new (isOnPremise boolean) patterns
    // Never send TenantName if: boolean true (on-premise), empty string, null, or undefined
    let tenantName = tenantNameOrIsOnPrem
    if (typeof tenantNameOrIsOnPrem === 'boolean' && tenantNameOrIsOnPrem) {
      // isOnPremise = true, don't send TenantName
      tenantName = ''
    }

    if (tenantName && typeof tenantName === 'string' && tenantName.trim()) {
      basicHeaders.TenantName = tenantName.trim()
    }

    try {
      // Debug: Log headers being sent (excluding Authorization for security)
      const headersToLog = { ...basicHeaders }
      const authHeader = headersToLog.Authorization
      delete headersToLog.Authorization
      console.log('🔐 thereforeService.connect - Headers sent:', headersToLog)
      console.log('🔐 TenantName included:', 'TenantName' in basicHeaders)

      // Log auth info (masked for security)
      const authParts = authHeader ? authHeader.split(' ') : []
      const encodedCreds = authParts[1] || 'MISSING'
      const decodedCreds = encodedCreds !== 'MISSING' ? atob(encodedCreds) : ''
      const [sentUser, sentPass] = decodedCreds.split(':')

      console.log('🔐 Authorization present:', !!authHeader)
      console.log('🔐 Usuario en credenciales:', sentUser || 'MISSING')
      console.log('🔐 Contraseña (primeros 3 chars):', sentPass ? sentPass.substring(0, 3) + '***' : 'MISSING')
      console.log('🔐 URL destino:', url + '/GetConnectionToken')
      console.log('🔐 Body enviado: {}')
      console.log('🔐 Método: POST')

      // Try with empty body first, some servers require JSON object
      let resp = await fetch(url + '/GetConnectionToken', {
        method: 'POST',
        headers: basicHeaders,
        body: '{}'
      })

      // If 500 error, try without body
      if (!resp.ok && resp.status === 500) {
        console.log('🔄 Retrying without body...')
        resp = await fetch(url + '/GetConnectionToken', {
          method: 'POST',
          headers: basicHeaders
        })
      }

      if (!resp.ok) {
        let errorMsg = `HTTP ${resp.status}`
        if (resp.status === 401) {
          errorMsg = 'Credenciales inválidas'
        } else if (resp.status === 500) {
          try {
            const errorText = await resp.text()
            console.error('💥 Therefore 500 response body:', errorText)
            const errorData = JSON.parse(errorText)
            errorMsg = errorData.message || errorData.error || `Servidor error: ${resp.status}`
          } catch {
            errorMsg = 'Error del servidor Therefore (500). Verifica credenciales, URL y parámetros enviados'
          }
        }
        throw new Error(errorMsg)
      }

      const { Token } = await resp.json()
      const headers = {
        Authorization: 'Basic ' + btoa(usuario + ':' + Token),
        'Content-Type': 'application/json',
        Accept: 'application/json',
        UseToken: '1'
      }
      if (tenantName && typeof tenantName === 'string' && tenantName.trim()) {
        headers.TenantName = tenantName.trim()
      }

      return { token: Token, headers, baseUrl: url }
    } catch (err) {
      throw new Error('Error de conexión: ' + err.message)
    }
  }

  /**
   * NEW: Get category tree structure
   */
  async getCategoryTree(baseUrl, headers) {
    const resp = await fetch(baseUrl + '/GetCategoriesTree', {
      method: 'POST',
      headers,
      body: '{}'
    })

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    return data.TreeItems || data.Categories || []
  }

  /**
   * NEW: Get category fields, filtering FieldType === 8 (table fields)
   */
  async getCategoryInfo(baseUrl, headers, categoryNo) {
    const resp = await fetch(baseUrl + '/GetCategoryInfo', {
      method: 'POST',
      headers,
      body: JSON.stringify({ CategoryNo: categoryNo })
    })

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    const fields = (data.CategoryFields || data.Fields || []).filter(f => f.ColName && f.FieldType !== 8)
    return { fields, categoryNo }
  }

  /**
   * NEW: Execute multi-category query with full pagination support
   * Retorna: { rows: [{_cat, DocNo, ...fields}], canonicalFields: [...], catNames: {}, error?: msg }
   */
  async executeMultiQuery(baseUrl, headers, queries, savedFields, onProgress = null) {
    const savedSet = new Set(savedFields || [])

    try {
      // 1. Execute initial query
      if (onProgress) onProgress(10, 'Ejecutando consulta...')

      const resp = await fetch(baseUrl + '/ExecuteMultiQuery', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          Queries: queries,
          MaxRows: 500000,
          RowBlockSize: 500
        })
      })

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json()

      let rows = []
      let queryId = data.QueryID
      let hasMore = data.HasMoreRows
      let page = 1

      // 2. Determine canonical fields from first non-empty QueryResult.Columns
      const firstQR = (data.QueryResults || []).find(qr => qr.Columns?.length > 0)
      const canonicalFields = [
        'DocNo',
        ...(firstQR?.Columns || [])
          .map(c => c.IndexDataFieldName)
          .filter(n => n && n !== 'DocNo' && savedSet.has(n))
      ]

      // 3. Process first page
      this._processPage(data.QueryResults || [], canonicalFields, rows)
      if (onProgress) onProgress(30, `Página ${page} — ${rows.length} registros`)

      // 4. Pagination loop
      while (hasMore) {
        page++
        const nextResp = await fetch(baseUrl + '/GetNextMultiQueryRows', {
          method: 'POST',
          headers,
          body: JSON.stringify({ QueryID: queryId })
        })

        if (!nextResp.ok) break
        const nextData = await nextResp.json()
        this._processPage(nextData.QueryResults || [], canonicalFields, rows)
        hasMore = nextData.HasMoreRows
        if (onProgress) onProgress(Math.min(30 + page * 3, 90), `Página ${page} — ${rows.length} registros`)
      }

      // 5. Release query (fire-and-forget)
      if (queryId) {
        setTimeout(() => {
          fetch(baseUrl + '/ReleaseMultiQuery', {
            method: 'POST',
            headers,
            body: JSON.stringify({ QueryID: queryId })
          }).catch(() => {})
        }, 0)
      }

      if (onProgress) onProgress(100, 'Renderizando...')

      return { rows, canonicalFields, error: null }
    } catch (err) {
      logger.error('executeMultiQuery error:', err)
      return { rows: [], canonicalFields: [], error: err.message }
    }
  }

  /**
   * Helper: Process a page of QueryResults using Columns mapping
   * CRITICAL: Use Columns[i].IndexDataFieldName for mapping, not GetCategoryInfo order
   */
  _processPage(queryResults, canonicalFields, rowsArray) {
    if (!Array.isArray(queryResults)) return

    queryResults.forEach(qr => {
      const catNo = qr.CategoryNo
      const columns = Array.isArray(qr.Columns) ? qr.Columns : []

      // Build column map: fieldName → index in IndexValues
      const colMap = {}
      columns.forEach((col, i) => {
        if (col && col.IndexDataFieldName) {
          colMap[col.IndexDataFieldName] = i
        }
      })

      // Process each row
      const resultRows = Array.isArray(qr.ResultRows) ? qr.ResultRows : []
      resultRows.forEach(row => {
        if (!row) return
        const rec = { _cat: catNo }
        canonicalFields.forEach(fname => {
          if (fname === 'DocNo') {
            rec.DocNo = row.DocNo ?? ''
            return
          }
          const idx = colMap[fname]
          const indexValues = Array.isArray(row.IndexValues) ? row.IndexValues : []
          rec[fname] = idx !== undefined && idx < indexValues.length
            ? (indexValues[idx] == null ? '' : String(indexValues[idx]))
            : ''
        })
        rowsArray.push(rec)
      })
    })
  }
}

export const thereforeService = new ThereforeService()
