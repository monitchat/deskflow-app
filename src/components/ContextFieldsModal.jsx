import { useState, useEffect } from 'react'
import api from '../config/axios'

function ContextFieldsModal({ onClose, onSelect }) {
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedField, setCopiedField] = useState(null)

  useEffect(() => {
    loadFields()
  }, [])

  // Listener para fechar modal com ESC
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const loadFields = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/v1/flows/context/fields')
      setFields(response.data.data.fields || [])
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar campos')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedField(text)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const filteredFields = fields.filter(
    (field) =>
      field.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.example.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '800px', maxHeight: '80vh' }}
      >
        <h2>🔍 Campos Disponíveis no Contexto</h2>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Use o formato <code style={{ background: '#f5f5f5', padding: '2px 6px' }}>
            $&#123;&#123;campo&#125;&#125;
          </code>{' '}
          nas mensagens para substituir automaticamente.
        </p>

        {loading && <p>Carregando campos...</p>}

        {error && (
          <div
            style={{
              padding: '1rem',
              background: '#ffebee',
              borderRadius: '4px',
              marginBottom: '1rem',
            }}
          >
            <strong>Erro:</strong> {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="form-group">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔎 Buscar campo..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                }}
              />
            </div>

            {filteredFields.length === 0 && (
              <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
                {searchTerm
                  ? `Nenhum campo encontrado para "${searchTerm}"`
                  : 'Nenhum campo disponível. Inicie uma conversa primeiro.'}
              </p>
            )}

            <div
              style={{
                maxHeight: '400px',
                overflowY: 'auto',
                marginBottom: '1rem',
              }}
            >
              {filteredFields.map((field, index) => (
                <div
                  key={index}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginBottom: '0.5rem',
                    backgroundColor: '#fff',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          fontSize: '0.95rem',
                          marginBottom: '0.25rem',
                        }}
                      >
                        {field.path}
                      </div>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          color: '#666',
                          background: '#f5f5f5',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '3px',
                          marginTop: '0.25rem',
                        }}
                      >
                        Exemplo: {field.example}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(field.usage)}
                      style={{
                        marginLeft: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.8rem',
                        border: '1px solid #4CAF50',
                        borderRadius: '4px',
                        background: copiedField === field.usage ? '#4CAF50' : '#fff',
                        color: copiedField === field.usage ? '#fff' : '#4CAF50',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {copiedField === field.usage ? '✓ Copiado!' : '📋 Copiar'}
                    </button>
                  </div>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      color: '#2196F3',
                      background: '#e3f2fd',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '3px',
                    }}
                  >
                    {field.usage}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: '0.75rem',
                background: '#e8f5e9',
                borderRadius: '4px',
                fontSize: '0.85rem',
              }}
            >
              <strong>💡 Dica:</strong> Clique em "Copiar" para copiar a variável
              completa ({' '}
              <code style={{ background: '#fff', padding: '2px 4px' }}>
                $&#123;&#123;...&#125;&#125;
              </code>
              ) e cole diretamente na sua mensagem.
            </div>
          </>
        )}

        <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContextFieldsModal
