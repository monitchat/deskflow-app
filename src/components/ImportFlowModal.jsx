import { useState, useRef, useCallback, useEffect } from 'react'
import api from '../config/axios'
import ApiKeyField from './ApiKeyField'

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Google Gemini' },
]

// Vision-capable models to prioritize in filtered results
const OPENAI_VISION_KEYWORDS = ['gpt-4o', 'gpt-4-turbo', 'gpt-4-vision', 'gpt-5', 'o1', 'o3', 'o4']
const GEMINI_VISION_KEYWORDS = ['gemini']

const PDF_PROGRESS = [
  'Convertendo PDF em imagens...',
  'Analisando fluxograma...',
  'Identificando blocos e conexoes...',
  'Gerando nos e edges...',
  'Montando estrutura do fluxo...',
  'Finalizando...',
]

const PROMPT_PROGRESS = [
  'Analisando sua descricao...',
  'Planejando a estrutura do fluxo...',
  'Criando nos e conexoes...',
  'Organizando layout...',
  'Finalizando...',
]

const inputStyle = {
  width: '100%',
  padding: '0.55rem 0.7rem',
  borderRadius: '8px',
  border: '1px solid var(--border, #334155)',
  backgroundColor: 'var(--input-bg, var(--bg-secondary, #1e293b))',
  color: 'var(--text, #e2e8f0)',
  fontSize: '0.85rem',
  boxSizing: 'border-box',
  outline: 'none',
}

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-secondary, var(--text-dim, #94a3b8))',
  marginBottom: '0.3rem',
}

function ImportFlowModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('prompt') // 'pdf' ou 'prompt'
  const [file, setFile] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [provider, setProvider] = useState('openai')
  const [model, setModel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progressIdx, setProgressIdx] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [availableModels, setAvailableModels] = useState([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelsError, setModelsError] = useState(null)
  const [pdfCustomPrompt, setPdfCustomPrompt] = useState('')
  const [showCustomPrompt, setShowCustomPrompt] = useState(false)
  const fileInputRef = useRef(null)
  const progressTimerRef = useRef(null)

  const progressMessages = mode === 'pdf' ? PDF_PROGRESS : PROMPT_PROGRESS

  // Resolve variable references to actual API key values
  const resolveApiKey = async (key) => {
    if (!key) return null

    // ${{secret.NAME}} - resolve via global settings
    if (key.includes('${{secret.')) {
      const match = key.match(/\$\{\{secret\.(.+?)\}\}/)
      if (match) {
        try {
          const res = await api.get(`/api/v1/settings/secrets/${match[1]}/resolve`)
          if (res.data.success && res.data.data) {
            return res.data.data
          }
        } catch {
          // fall through
        }
      }
      return null
    }

    // ${{env.NAME}} - cannot resolve on frontend
    if (key.includes('${{env.')) {
      return null
    }

    return key
  }

  // Fetch OpenAI models
  const fetchOpenAIModels = async (resolvedKey) => {
    setLoadingModels(true)
    setModelsError(null)
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${resolvedKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      const modelsList = result.data || []

      // Filter vision-capable GPT models
      const visionModels = modelsList
        .filter(m => OPENAI_VISION_KEYWORDS.some(kw => m.id.includes(kw)))
        .map(m => m.id)
        .sort()
        .reverse()

      setAvailableModels(visionModels)
      if (visionModels.length > 0 && !model) {
        setModel(visionModels[0])
      }
    } catch (error) {
      console.error('Error fetching OpenAI models:', error)
      setModelsError(error.message || 'Erro ao buscar modelos da OpenAI')
      setAvailableModels([])
    } finally {
      setLoadingModels(false)
    }
  }

  // Fetch Gemini models
  const fetchGeminiModels = async (resolvedKey) => {
    setLoadingModels(true)
    setModelsError(null)
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${resolvedKey}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      const modelsList = result.models || []

      // Filter vision-capable models (those supporting generateContent)
      const visionModels = modelsList
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => m.name.replace('models/', ''))
        .sort()
        .reverse()

      setAvailableModels(visionModels)
      if (visionModels.length > 0 && !model) {
        setModel(visionModels[0])
      }
    } catch (error) {
      console.error('Error fetching Gemini models:', error)
      setModelsError(error.message || 'Erro ao buscar modelos do Gemini')
      setAvailableModels([])
    } finally {
      setLoadingModels(false)
    }
  }

  // Fetch models when apiKey or provider changes
  useEffect(() => {
    if (!apiKey || apiKey.trim().length < 5) {
      setAvailableModels([])
      setModelsError(null)
      return
    }

    // env vars cannot be resolved on frontend
    if (apiKey.includes('${{env.')) {
      setAvailableModels([])
      setModelsError(null)
      return
    }

    const timer = setTimeout(async () => {
      const resolvedKey = await resolveApiKey(apiKey)
      if (!resolvedKey) {
        setAvailableModels([])
        if (apiKey.includes('${{')) {
          setModelsError('Nao foi possivel resolver a variavel. Digite o modelo manualmente.')
        }
        return
      }

      if (provider === 'openai') {
        fetchOpenAIModels(resolvedKey)
      } else if (provider === 'gemini') {
        fetchGeminiModels(resolvedKey)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [apiKey, provider])

  const handleProviderChange = (newProvider) => {
    setProvider(newProvider)
    setModel('')
    setAvailableModels([])
    setModelsError(null)
  }

  const handleFileDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const droppedFile = e.dataTransfer?.files?.[0]
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile)
      setError(null)
    } else {
      setError('Apenas arquivos PDF sao aceitos.')
    }
  }, [])

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setError(null)
    }
  }

  const startProgress = () => {
    setProgressIdx(0)
    let idx = 0
    progressTimerRef.current = setInterval(() => {
      idx = (idx + 1) % progressMessages.length
      setProgressIdx(idx)
    }, 3000)
  }

  const stopProgress = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
  }

  const handleSubmit = async () => {
    if (mode === 'pdf' && !file) {
      setError('Selecione um arquivo PDF.')
      return
    }
    if (mode === 'prompt' && !prompt.trim()) {
      setError('Descreva o fluxo que deseja criar.')
      return
    }
    if (!apiKey.trim()) {
      setError('Informe a API Key.')
      return
    }

    setLoading(true)
    setError(null)
    startProgress()

    try {
      let response

      if (mode === 'pdf') {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('api_key', apiKey)
        formData.append('provider', provider)
        formData.append('model', model)
        if (pdfCustomPrompt.trim()) {
          formData.append('custom_prompt', pdfCustomPrompt.trim())
        }

        response = await api.post('/api/v1/flows/import-pdf', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 180000,
        })
      } else {
        response = await api.post('/api/v1/flows/generate-from-prompt', {
          prompt,
          api_key: apiKey,
          provider,
          model,
        }, { timeout: 180000 })
      }

      if (response.data.success) {
        stopProgress()
        onSuccess(response.data.data)
      } else {
        setError(response.data.error || 'Erro ao gerar fluxo.')
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        'Erro ao gerar fluxo. Tente novamente.'
      setError(msg)
    } finally {
      setLoading(false)
      stopProgress()
    }
  }

  const canSubmit = mode === 'pdf'
    ? file && apiKey.trim()
    : prompt.trim() && apiKey.trim()

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20000,
        animation: 'confirmFadeIn 0.15s ease-out',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes confirmFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes confirmSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg, #0f172a)',
          borderRadius: '14px',
          width: '560px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.4)',
          animation: 'confirmSlideIn 0.2s ease-out',
          border: '1px solid var(--border, #334155)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem 0.75rem' }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--text, #e2e8f0)',
          }}>
            Criar Fluxo com IA
          </h3>
          <p style={{
            margin: '0.3rem 0 0',
            fontSize: '0.82rem',
            color: 'var(--text-dim, #94a3b8)',
          }}>
            Descreva o fluxo ou envie um PDF com o fluxograma
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0',
          margin: '0 1.5rem',
          borderBottom: '2px solid var(--border, #334155)',
        }}>
          {[
            { key: 'prompt', icon: '✨', label: 'Descrever com texto' },
            { key: 'pdf', icon: '📄', label: 'Importar PDF' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setMode(tab.key); setError(null) }}
              style={{
                flex: 1,
                padding: '0.6rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                backgroundColor: 'transparent',
                color: mode === tab.key ? '#7C3AED' : 'var(--text-dim, #94a3b8)',
                border: 'none',
                borderBottom: mode === tab.key ? '2px solid #7C3AED' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: '-2px',
                transition: 'all 0.15s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '1rem 1.5rem' }}>

          {/* Prompt mode */}
          {mode === 'prompt' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Descreva o fluxo</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Ex: Crie um fluxo de atendimento para uma imobiliaria. O bot começa dando boas-vindas e oferece as opcoes:\n1. Sou cliente\n2. Quero comprar um imovel\n3. Falar com corretor\n\nSe for cliente, pergunta o CPF e consulta no sistema. Se quiser comprar, mostra os empreendimentos disponiveis. Se quiser corretor, transfere para o departamento comercial.`}
                style={{
                  ...inputStyle,
                  minHeight: '140px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                }}
              />
              <small style={{
                display: 'block',
                fontSize: '0.72rem',
                color: 'var(--text-dim, #64748b)',
                marginTop: '0.3rem',
              }}>
                Quanto mais detalhada a descricao, melhor sera o fluxo gerado
              </small>
            </div>
          )}

          {/* PDF mode */}
          {mode === 'pdf' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '1.5rem',
                border: `2px dashed ${dragOver ? '#7C3AED' : file ? '#22c55e' : 'var(--border, #475569)'}`,
                borderRadius: '10px',
                backgroundColor: dragOver
                  ? 'rgba(124, 58, 237, 0.1)'
                  : file
                    ? 'rgba(34, 197, 94, 0.05)'
                    : 'var(--bg-secondary, #1e293b)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '1rem',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              {file ? (
                <div>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>📄</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text, #e2e8f0)' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim, #94a3b8)' }}>
                    {(file.size / 1024).toFixed(1)} KB - Clique para trocar
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>📤</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text, #e2e8f0)', fontWeight: 500 }}>
                    Arraste o PDF aqui ou clique para selecionar
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim, #94a3b8)', marginTop: '0.2rem' }}>
                    Maximo: 20MB
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Prompt (PDF mode) */}
          {mode === 'pdf' && (
            <div style={{ marginBottom: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7C3AED',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  padding: '0.3rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontWeight: 500,
                }}
              >
                <span style={{
                  transform: showCustomPrompt ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  display: 'inline-block',
                }}>▶</span>
                ✏️ Prompt personalizado (opcional)
              </button>
              {showCustomPrompt && (
                <div style={{ marginTop: '0.4rem' }}>
                  <textarea
                    value={pdfCustomPrompt}
                    onChange={(e) => setPdfCustomPrompt(e.target.value)}
                    placeholder="Deixe vazio para usar o prompt padrão. Aqui você pode adicionar instruções extras para a IA interpretar o PDF, como: 'Os blocos verdes são mensagens, os azuis são condições, ignore o cabeçalho da empresa...'"
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      fontSize: '0.82rem',
                      backgroundColor: 'var(--bg-secondary, #1e293b)',
                      color: 'var(--text, #e2e8f0)',
                      border: '1px solid var(--border, #475569)',
                      borderRadius: '8px',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'inherit',
                      lineHeight: 1.4,
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#7C3AED'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border, #475569)'}
                  />
                  <small style={{ color: 'var(--text-dim, #94a3b8)', fontSize: '0.72rem' }}>
                    Se preenchido, substitui o prompt padrão de interpretação. Descreva como a IA deve interpretar os elementos visuais do seu PDF.
                  </small>
                </div>
              )}
            </div>
          )}

          {/* Provider */}
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Provedor</label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleProviderChange(p.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    backgroundColor: provider === p.value ? '#7C3AED' : 'transparent',
                    color: provider === p.value ? '#fff' : 'var(--text-dim, #94a3b8)',
                    border: `1px solid ${provider === p.value ? '#7C3AED' : 'var(--border, #475569)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model */}
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>
              Modelo
              {loadingModels && (
                <span style={{
                  marginLeft: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#a78bfa',
                }}>
                  Carregando modelos...
                </span>
              )}
            </label>
            {availableModels.length > 0 ? (
              <>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={loadingModels}
                  style={{
                    ...inputStyle,
                    opacity: loadingModels ? 0.6 : 1,
                  }}
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <small style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  color: 'var(--text-dim, #64748b)',
                  marginTop: '0.2rem',
                }}>
                  {availableModels.length} modelo{availableModels.length !== 1 ? 's' : ''} disponivel{availableModels.length !== 1 ? 'is' : ''}
                </small>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={loadingModels}
                  placeholder={
                    loadingModels
                      ? 'Buscando modelos disponiveis...'
                      : provider === 'openai'
                        ? 'gpt-4o'
                        : 'gemini-2.0-flash'
                  }
                  style={{
                    ...inputStyle,
                    opacity: loadingModels ? 0.6 : 1,
                  }}
                />
                {modelsError && (
                  <small style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    color: '#f59e0b',
                    marginTop: '0.2rem',
                  }}>
                    {modelsError}
                  </small>
                )}
                {!loadingModels && !modelsError && apiKey && (
                  <small style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    color: 'var(--text-dim, #64748b)',
                    marginTop: '0.2rem',
                  }}>
                    Digite o nome do modelo manualmente
                  </small>
                )}
              </>
            )}
          </div>

          {/* API Key */}
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>API Key</label>
            <ApiKeyField
              value={apiKey}
              onChange={setApiKey}
              flowId={null}
              provider={provider}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '0.6rem 0.75rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.82rem',
              marginBottom: '0.75rem',
              lineHeight: 1.4,
            }}>
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{
              padding: '1rem',
              borderRadius: '10px',
              backgroundColor: 'rgba(124, 58, 237, 0.08)',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              textAlign: 'center',
              marginBottom: '0.75rem',
            }}>
              <div style={{
                width: '24px', height: '24px',
                border: '3px solid rgba(124, 58, 237, 0.2)',
                borderTopColor: '#7C3AED',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                margin: '0 auto 0.6rem',
              }} />
              <div style={{
                fontSize: '0.85rem', fontWeight: 600,
                color: '#a78bfa',
                animation: 'pulse 2s ease-in-out infinite',
              }}>
                {progressMessages[progressIdx]}
              </div>
              <div style={{
                fontSize: '0.72rem',
                color: 'var(--text-dim, #64748b)',
                marginTop: '0.3rem',
              }}>
                {mode === 'pdf'
                  ? 'Isso pode levar ate 2 minutos dependendo do tamanho do PDF'
                  : 'Gerando fluxo, isso pode levar alguns segundos...'}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.75rem 1.5rem 1.25rem',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.5rem',
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--bg-secondary, #1e293b)',
              color: 'var(--text, #e2e8f0)',
              border: '1px solid var(--border, #475569)',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              opacity: loading ? 0.5 : 1,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: loading || !canSubmit ? '#475569' : '#7C3AED',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: loading || !canSubmit ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.15s',
            }}
          >
            {loading
              ? (mode === 'pdf' ? 'Importando...' : 'Gerando...')
              : (mode === 'pdf' ? 'Importar' : 'Gerar Fluxo')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImportFlowModal
