import { useState, useEffect, useRef } from 'react'
import api from '../config/axios'

function AutocompleteTextarea({ value, onChange, placeholder, rows = 4, extraSuggestions = [] }) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [filteredSuggestions, setFilteredSuggestions] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const textareaRef = useRef(null)
  const suggestionsRef = useRef(null)

  useEffect(() => {
    loadContextFields()
  }, [JSON.stringify(extraSuggestions)])

  const loadContextFields = async () => {
    try {
      const response = await api.get('/api/v1/flows/context/fields')
      const fields = response.data.data.fields || []
      const contextSuggestions = fields.map((f) => ({
        label: f.path,
        value: f.path,
        example: f.example,
      }))
      // Merge com sugestões extras (ex: variáveis de loop)
      setSuggestions([...extraSuggestions, ...contextSuggestions])
    } catch (err) {
      console.error('Error loading context fields:', err)
      // Mesmo com erro, mostra sugestões extras
      if (extraSuggestions.length > 0) {
        setSuggestions(extraSuggestions)
      }
    }
  }

  const handleChange = (e) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart
    onChange(e)
    setCursorPosition(cursorPos)

    // Verifica se o usuário digitou $
    const textBeforeCursor = newValue.substring(0, cursorPos)
    const match = textBeforeCursor.match(/\$\{?\{?(\w*)$/i)

    if (match) {
      const search = match[1] || ''
      setSearchTerm(search)

      // Filtra sugestões
      const filtered = suggestions.filter((s) =>
        s.label.toLowerCase().includes(search.toLowerCase())
      )
      setFilteredSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
      setSelectedIndex(0)
    } else {
      setShowSuggestions(false)
    }
  }

  const insertSuggestion = (suggestion) => {
    const textarea = textareaRef.current
    const textBeforeCursor = value.substring(0, cursorPosition)
    const textAfterCursor = value.substring(cursorPosition)

    // Remove o $ ou ${ ou ${{ digitado
    const cleanTextBefore = textBeforeCursor.replace(/\$\{?\{?(\w*)$/i, '')

    // Insere a variável completa
    const newValue = `${cleanTextBefore}\${{${suggestion.value}}}${textAfterCursor}`
    const newCursorPos = cleanTextBefore.length + suggestion.value.length + 4 // 4 = ${{}}

    onChange({ target: { value: newValue } })
    setShowSuggestions(false)

    // Reposiciona o cursor
    setTimeout(() => {
      textarea.selectionStart = newCursorPos
      textarea.selectionEnd = newCursorPos
      textarea.focus()
    }, 0)
  }

  const handleKeyDown = (e) => {
    if (!showSuggestions) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        )
        break
      case 'Enter':
      case 'Tab':
        if (filteredSuggestions.length > 0) {
          e.preventDefault()
          insertSuggestion(filteredSuggestions[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowSuggestions(false)
        break
      default:
        break
    }
  }

  // Calcula a posição do dropdown
  const getDropdownPosition = () => {
    if (!textareaRef.current) return { top: 0, left: 0 }

    const textarea = textareaRef.current
    const { offsetTop, offsetLeft, scrollTop } = textarea

    // Estimativa aproximada - pode ser melhorada
    const lineHeight = 20
    const lines = value.substring(0, cursorPosition).split('\n').length
    const top = offsetTop + lines * lineHeight - scrollTop + 5

    return {
      top: `${top}px`,
      left: `${offsetLeft}px`,
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: '100%',
          fontFamily: 'monospace',
          fontSize: '0.95rem',
        }}
      />

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          style={{
            position: 'absolute',
            ...getDropdownPosition(),
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            minWidth: '300px',
          }}
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion.value}
              onClick={() => insertSuggestion(suggestion)}
              style={{
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                backgroundColor: index === selectedIndex ? '#e3f2fd' : '#fff',
                borderBottom:
                  index < filteredSuggestions.length - 1
                    ? '1px solid #eee'
                    : 'none',
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                }}
              >
                ${`{{${suggestion.label}}}`}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#666',
                  marginTop: '0.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>{suggestion.example}</span>
                {suggestion.source && (
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                    whiteSpace: 'nowrap',
                  }}>
                    {suggestion.source}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <small
        style={{
          color: '#666',
          marginTop: '0.5rem',
          display: 'block',
          fontSize: '0.85rem',
        }}
      >
        💡 Digite <code>$</code> para ver campos disponíveis do contexto
      </small>
    </div>
  )
}

export default AutocompleteTextarea
