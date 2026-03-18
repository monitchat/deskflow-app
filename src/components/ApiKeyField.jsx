import { useState, useEffect } from 'react'
import api from '../config/axios'

function ApiKeyField({ value, onChange, flowId, provider }) {
  const isVariable = value && (value.startsWith('${{secret.') || value.startsWith('${{env.'))
  const [mode, setMode] = useState(isVariable ? 'variable' : 'direct')
  const [secretKeys, setSecretKeys] = useState([])
  const [variableKeys, setVariableKeys] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  useEffect(() => {
    if (flowId) {
      loadSecretKeys()
      loadVariableKeys()
    }
  }, [flowId])

  const loadSecretKeys = async () => {
    try {
      const res = await api.get(`/api/v1/flows/${flowId}/secrets`)
      if (res.data.success && res.data.data) {
        const data = res.data.data
        if (data.keys && Array.isArray(data.keys)) {
          setSecretKeys(data.keys)
        }
      }
    } catch (err) {
      // silently fail
    }
  }

  const loadVariableKeys = async () => {
    try {
      const res = await api.get(`/api/v1/flows/${flowId}/variables`)
      if (res.data.success && res.data.data) {
        const vars = res.data.data.variables || {}
        setVariableKeys(Object.keys(vars))
      }
    } catch (err) {
      // silently fail
    }
  }

  const placeholder = provider === 'gemini' ? 'AIza...' : 'sk-proj-...'

  const parseVariable = () => {
    if (!value) return { type: 'secret', name: '' }
    // Match com ou sem nome após o ponto
    const match = value.match(/\$\{\{(secret|env)\.(.*?)\}\}/)
    if (match) return { type: match[1], name: match[2] || '' }
    return { type: 'secret', name: '' }
  }

  const { type: varType, name: varName } = parseVariable()

  const buildVariable = (type, name) => {
    if (!name || !name.trim()) return `\${{${type}.}}`
    return `\${{${type}.${name.trim()}}}`
  }

  // Filtra sugestões baseado no tipo e no que o usuário digitou
  const availableKeys = varType === 'secret' ? secretKeys : variableKeys
  const suggestions = availableKeys.filter(
    k => !varName || k.toLowerCase().includes(varName.toLowerCase())
  )

  return (
    <div>
      {/* Toggle */}
      <div style={{ display: 'flex', marginBottom: '0.35rem' }}>
        <button
          type="button"
          onClick={() => { setMode('direct'); if (isVariable) onChange('') }}
          style={{
            padding: '0.3rem 0.7rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: mode === 'direct' ? '#6366f1' : 'transparent',
            color: mode === 'direct' ? '#fff' : '#64748b',
            border: `1px solid ${mode === 'direct' ? '#6366f1' : '#334155'}`,
            borderRadius: '6px 0 0 6px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          🔑 Digitar Key
        </button>
        <button
          type="button"
          onClick={() => { setMode('variable'); if (!isVariable) onChange('') }}
          style={{
            padding: '0.3rem 0.7rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: mode === 'variable' ? '#8B5CF6' : 'transparent',
            color: mode === 'variable' ? '#fff' : '#64748b',
            border: `1px solid ${mode === 'variable' ? '#8B5CF6' : '#334155'}`,
            borderRadius: '0 6px 6px 0',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          📦 Usar Variável
        </button>
      </div>

      {mode === 'direct' ? (
        <>
          <input
            type="password"
            value={!isVariable ? (value || '') : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={inputStyle}
          />
          <small style={helpStyle}>
            {provider === 'openai' && 'Obtenha em platform.openai.com/api-keys'}
            {provider === 'gemini' && 'Obtenha em aistudio.google.com/apikey'}
            {provider === 'azure' && 'Obtenha no Azure Portal'}
          </small>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'stretch' }}>
            <select
              value={varType}
              onChange={(e) => {
                const newType = e.target.value
                // Limpa o nome ao trocar de tipo
                onChange(`\${{${newType}.}}`)
                setShowSuggestions(true)
              }}
              style={{ ...inputStyle, width: '130px', flex: 'none', position: 'relative', zIndex: 100 }}
            >
              <option value="secret">secret.</option>
              <option value="env">env.</option>
            </select>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={varName}
                onChange={(e) => {
                  onChange(buildVariable(varType, e.target.value))
                  setShowSuggestions(true)
                  setSelectedIndex(-1)
                }}
                onFocus={() => { setShowSuggestions(true); setSelectedIndex(-1) }}
                onBlur={() => setTimeout(() => { setShowSuggestions(false); setSelectedIndex(-1) }, 250)}
                onKeyDown={(e) => {
                  const items = varName ? suggestions : availableKeys
                  if (!showSuggestions || items.length === 0) return

                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setSelectedIndex((prev) => (prev + 1) % items.length)
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
                  } else if (e.key === 'Enter' && selectedIndex >= 0) {
                    e.preventDefault()
                    onChange(buildVariable(varType, items[selectedIndex]))
                    setShowSuggestions(false)
                    setSelectedIndex(-1)
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false)
                    setSelectedIndex(-1)
                  }
                }}
                placeholder={varType === 'secret' ? 'OPENAI_KEY' : 'OPENAI_API_KEY'}
                style={{ ...inputStyle, fontFamily: 'monospace' }}
                autoFocus
              />

              {/* Autocomplete dropdown */}
              {showSuggestions && availableKeys.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 100,
                  marginTop: '2px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  maxHeight: '150px',
                  overflowY: 'auto',
                }}>
                  {(varName ? suggestions : availableKeys).map((key, idx) => (
                    <button
                      key={key}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        onChange(buildVariable(varType, key))
                        setShowSuggestions(false)
                        setSelectedIndex(-1)
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        width: '100%',
                        padding: '0.4rem 0.6rem',
                        border: 'none',
                        backgroundColor: idx === selectedIndex ? '#334155' : 'transparent',
                        color: '#e2e8f0',
                        fontSize: '0.8rem',
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        textAlign: 'left',
                        borderBottom: '1px solid #0f172a',
                      }}
                    >
                      <span style={{ color: varType === 'secret' ? '#8B5CF6' : '#06b6d4', fontSize: '0.7rem' }}>{varType}.</span>
                      <span>{key}</span>
                    </button>
                  ))}
                  {varName && suggestions.length === 0 && availableKeys.length > 0 && !availableKeys.includes(varName) && (
                    <div style={{
                      padding: '0.4rem 0.6rem',
                      fontSize: '0.75rem',
                      color: '#f59e0b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}>
                      ⚠️ "{varName}" não encontrado no fluxo
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {value && (
            <div style={{
              marginTop: '0.3rem',
              padding: '0.35rem 0.6rem',
              borderRadius: '6px',
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              fontSize: '0.78rem',
              fontFamily: 'monospace',
              color: '#a5b4fc',
            }}>
              {value}
            </div>
          )}

          <small style={helpStyle}>
            {varType === 'secret'
              ? 'Configure secrets em menu → Variáveis de Ambiente'
              : 'Variável definida no .env ou docker-compose do servidor'
            }
          </small>
        </>
      )}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '0.45rem 0.6rem',
  borderRadius: '6px',
  border: '1px solid #334155',
  backgroundColor: '#1e293b',
  color: '#e2e8f0',
  fontSize: '0.85rem',
  boxSizing: 'border-box',
  outline: 'none',
}

const helpStyle = {
  display: 'block',
  fontSize: '0.72rem',
  color: '#64748b',
  marginTop: '0.25rem',
}

export default ApiKeyField
