import { useState, useEffect, useRef } from 'react'
import api from '../config/axios'
import ApiKeyField from './ApiKeyField'

const STATUS_COLORS = {
  ready: { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', label: 'Pronto' },
  processing: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', label: 'Processando...' },
  pending: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', label: 'Pendente' },
  error: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', label: 'Erro' },
}

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI', models: [
    { value: 'text-embedding-3-small', label: 'text-embedding-3-small (1536d, recomendado)' },
    { value: 'text-embedding-ada-002', label: 'text-embedding-ada-002 (1536d, legado)' },
  ]},
  { value: 'gemini', label: 'Google Gemini', models: [
    { value: 'models/text-embedding-004', label: 'text-embedding-004 (768d)' },
    { value: 'models/embedding-001', label: 'embedding-001 (768d, legado)' },
  ]},
]

function KnowledgeBasePanel({ flowId, onClose }) {
  const [bases, setBases] = useState([])
  const [selectedBase, setSelectedBase] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [view, setView] = useState('list') // list, create, detail, addText
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const fileInputRef = useRef(null)

  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    embedding_provider: 'openai',
    embedding_model: 'text-embedding-3-small',
    chunk_size: 512,
    chunk_overlap: 50,
    chunk_strategy: 'size',
    chunk_separator: '---',
    context_window: 0,
    api_key: '',
  })

  const [textForm, setTextForm] = useState({ name: '', text: '' })

  useEffect(() => {
    loadBases()
  }, [flowId])

  const loadBases = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/api/v1/knowledge/bases/${flowId}`)
      if (res.data.success) setBases(res.data.data)
    } catch (err) {
      setError('Erro ao carregar bases de conhecimento')
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async (kbId) => {
    try {
      const res = await api.get(`/api/v1/knowledge/bases/${kbId}/documents`)
      if (res.data.success) setDocuments(res.data.data)
    } catch (err) {
      setError('Erro ao carregar documentos')
    }
  }

  const handleCreateBase = async () => {
    try {
      setError(null)
      const res = await api.post('/api/v1/knowledge/bases', {
        flow_id: parseInt(flowId),
        name: form.name,
        description: form.description,
        embedding_provider: form.embedding_provider,
        embedding_model: form.embedding_model,
        chunk_size: form.chunk_size,
        chunk_overlap: form.chunk_overlap,
        chunk_strategy: form.chunk_strategy,
        chunk_separator: form.chunk_separator,
        context_window: form.context_window,
        api_key_ref: form.api_key,
      })
      if (res.data.success) {
        await loadBases()
        // Abre direto o detalhe da base criada
        const newKb = { id: res.data.data.id, name: res.data.data.name, embedding_provider: form.embedding_provider, embedding_model: form.embedding_model, api_key_ref: form.api_key }
        openBase(newKb)
        setForm((prev) => ({ ...prev, name: '', description: '' }))
      }
    } catch (err) {
      setError('Erro ao criar base')
    }
  }

  const handleDeleteBase = async (kbId) => {
    if (!confirm('Excluir esta base e todos os documentos?')) return
    try {
      await api.delete(`/api/v1/knowledge/bases/${kbId}`)
      await loadBases()
      if (selectedBase?.id === kbId) {
        setSelectedBase(null)
        setView('list')
      }
    } catch (err) {
      setError('Erro ao excluir base')
    }
  }

  const handleUpload = async (e) => {
    const file = e.target?.files?.[0]
    if (!file) {
      setError('Nenhum arquivo selecionado')
      return
    }
    if (!form.api_key) {
      setError('Informe a API key antes de enviar')
      return
    }

    try {
      setUploading(true)
      setError(null)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', form.api_key)

      const res = await api.post(
        `/api/v1/knowledge/bases/${selectedBase.id}/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }
      )

      console.log('Upload response:', res.data)

      await loadDocuments(selectedBase.id)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      console.error('Upload error:', err.response?.data || err)
      setError(err.response?.data?.error || 'Erro ao enviar arquivo: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleAddText = async () => {
    if (!textForm.text.trim() || !form.api_key) {
      setError('Preencha o texto e a API key')
      return
    }

    try {
      setUploading(true)
      setError(null)
      await api.post(`/api/v1/knowledge/bases/${selectedBase.id}/text`, {
        name: textForm.name || 'Texto manual',
        text: textForm.text,
        api_key: form.api_key,
      })

      await loadDocuments(selectedBase.id)
      setTextForm({ name: '', text: '' })
      setView('detail')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao adicionar texto')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDoc = async (docId) => {
    try {
      await api.delete(`/api/v1/knowledge/bases/${selectedBase.id}/documents/${docId}`)
      await loadDocuments(selectedBase.id)
    } catch (err) {
      setError('Erro ao excluir documento')
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || !form.api_key) return
    try {
      setSearching(true)
      const res = await api.post(`/api/v1/knowledge/bases/${selectedBase.id}/search`, {
        query: searchQuery,
        api_key: form.api_key,
        limit: 5,
      })
      if (res.data.success) setSearchResults(res.data.data)
    } catch (err) {
      setError('Erro na busca')
    } finally {
      setSearching(false)
    }
  }

  const openBase = async (kb) => {
    setSelectedBase(kb)
    setForm((prev) => ({
      ...prev,
      embedding_provider: kb.embedding_provider || prev.embedding_provider,
      embedding_model: kb.embedding_model || prev.embedding_model,
      api_key: kb.api_key_ref || '',
    }))
    loadDocuments(kb.id)
    setView('detail')
    setSearchResults(null)
    setSearchQuery('')

    // Busca dados frescos da API
    try {
      const res = await api.get(`/api/v1/knowledge/bases/${flowId}`)
      if (res.data.success) {
        const fresh = res.data.data.find((b) => b.id === kb.id)
        if (fresh) {
          setSelectedBase(fresh)
          setForm((prev) => ({
            ...prev,
            api_key: fresh.api_key_ref || prev.api_key,
          }))
        }
      }
    } catch (err) {
      // usa dados que já tem
    }
  }

  const providerModels = PROVIDERS.find(p => p.value === form.embedding_provider)?.models || []

  const renderList = () => (
    <>
      {bases.length === 0 && !loading && (
        <div style={{
          textAlign: 'center',
          padding: '2rem 1rem',
          color: '#94a3b8',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🧠</div>
          <p style={{ fontWeight: 600, color: 'var(--text, #e2e8f0)', marginBottom: '0.5rem' }}>
            Nenhuma base de conhecimento
          </p>
          <p style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>
            Crie uma base para que seus agentes de IA possam buscar informações em documentos, FAQs e textos.
          </p>
          <button onClick={() => setView('create')} style={btnPrimary}>
            + Criar Base de Conhecimento
          </button>
        </div>
      )}

      {bases.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {bases.map((kb) => (
            <div
              key={kb.id}
              onClick={() => openBase(kb)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>🧠</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f1f5f9' }}>
                  {kb.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: '0.75rem', marginTop: '0.15rem' }}>
                  <span>{kb.chunk_count} chunks</span>
                  <span>{kb.embedding_provider}/{kb.embedding_model}</span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteBase(kb.id) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, fontSize: '1rem' }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )

  const renderCreate = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <label style={labelStyle}>Nome *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ex: FAQ da Loja, Catálogo de Produtos"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Descrição</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Para que serve esta base de conhecimento"
          rows={2}
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Provedor de Embeddings</label>
          <select
            value={form.embedding_provider}
            onChange={(e) => {
              const provider = e.target.value
              const models = PROVIDERS.find(p => p.value === provider)?.models || []
              setForm({ ...form, embedding_provider: provider, embedding_model: models[0]?.value || '' })
            }}
            style={inputStyle}
          >
            {PROVIDERS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 2 }}>
          <label style={labelStyle}>Modelo</label>
          <select
            value={form.embedding_model}
            onChange={(e) => setForm({ ...form, embedding_model: e.target.value })}
            style={inputStyle}
          >
            {providerModels.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Tamanho do Chunk</label>
          <input
            type="number"
            value={form.chunk_size}
            onChange={(e) => setForm({ ...form, chunk_size: parseInt(e.target.value) || 512 })}
            min={100}
            max={4000}
            style={inputStyle}
          />
          <small style={helpStyle}>Caracteres por chunk (100-4000)</small>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Overlap</label>
          <input
            type="number"
            value={form.chunk_overlap}
            onChange={(e) => setForm({ ...form, chunk_overlap: parseInt(e.target.value) || 50 })}
            min={0}
            max={500}
            style={inputStyle}
          />
          <small style={helpStyle}>Sobreposição entre chunks</small>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Estratégia de Chunking</label>
        <select
          value={form.chunk_strategy}
          onChange={(e) => setForm({ ...form, chunk_strategy: e.target.value })}
          style={inputStyle}
        >
          <option value="size">Por tamanho (caracteres)</option>
          <option value="separator">Por separador (ex: ---)</option>
          <option value="paragraph">Por parágrafo</option>
        </select>
        <small style={helpStyle}>
          {form.chunk_strategy === 'size' && 'Divide o texto em pedaços de tamanho fixo, quebrando em limites naturais (frases, parágrafos)'}
          {form.chunk_strategy === 'separator' && 'Divide o texto pelo separador. Cada seção entre separadores vira um chunk independente'}
          {form.chunk_strategy === 'paragraph' && 'Divide por parágrafos (linha em branco). Agrupa parágrafos pequenos até atingir o tamanho máximo'}
        </small>
      </div>

      {form.chunk_strategy === 'separator' && (
        <div>
          <label style={labelStyle}>Separador</label>
          <input
            type="text"
            value={form.chunk_separator}
            onChange={(e) => setForm({ ...form, chunk_separator: e.target.value })}
            placeholder="---"
            style={inputStyle}
          />
          <small style={helpStyle}>Texto usado para dividir. Ex: ---, ===, ###, ~~~</small>
        </div>
      )}

      <div>
        <label style={labelStyle}>Janela de Contexto (chunks vizinhos)</label>
        <input
          type="number"
          value={form.context_window}
          onChange={(e) => setForm({ ...form, context_window: parseInt(e.target.value) || 0 })}
          min={0}
          max={5}
          style={{ ...inputStyle, width: '80px' }}
        />
        <small style={helpStyle}>
          Ao encontrar um trecho relevante, inclui N chunks antes e N depois para dar mais contexto.
          0 = só o chunk encontrado. 1 = chunk anterior + chunk + chunk seguinte. 2 = 2 antes + chunk + 2 depois.
        </small>
      </div>

      <div style={{
        padding: '0.6rem 0.75rem',
        borderRadius: '8px',
        backgroundColor: 'rgba(99, 102, 241, 0.06)',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        fontSize: '0.78rem',
        color: '#94a3b8',
        lineHeight: 1.5,
      }}>
        <strong>Dica:</strong> Chunks menores (256-512) + janela de contexto 1-2 é o melhor equilíbrio
        entre precisão na busca e contexto na resposta. Use separador para documentos estruturados
        (FAQ, catálogo com seções).
      </div>

      <div style={{
        padding: '0.75rem',
        borderRadius: '8px',
        border: '1px solid #334155',
        backgroundColor: '#0f172a',
      }}>
        <label style={{ ...labelStyle, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
          API Key para Embeddings ({form.embedding_provider === 'gemini' ? 'Gemini' : 'OpenAI'})
        </label>
        <ApiKeyField
          value={form.api_key}
          onChange={(v) => setForm({ ...form, api_key: v })}
          flowId={flowId}
          provider={form.embedding_provider}
        />
        <small style={helpStyle}>Necessária para processar documentos e fazer buscas</small>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button onClick={() => setView('list')} style={btnSecondary}>Cancelar</button>
        <button
          onClick={handleCreateBase}
          disabled={!form.name.trim()}
          style={{ ...btnPrimary, opacity: form.name.trim() ? 1 : 0.5 }}
        >
          Criar Base
        </button>
      </div>
    </div>
  )

  const renderDetail = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* API Key */}
      <div style={{
        padding: '0.75rem',
        borderRadius: '8px',
        border: '1px solid #334155',
        backgroundColor: '#0f172a',
      }}>
        <label style={{ ...labelStyle, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
          API Key para Embeddings ({selectedBase?.embedding_provider === 'gemini' ? 'Gemini' : 'OpenAI'})
        </label>
        <ApiKeyField
          value={form.api_key}
          onChange={(v) => setForm({ ...form, api_key: v })}
          flowId={flowId}
          provider={selectedBase?.embedding_provider}
        />
        <small style={helpStyle}>Necessária para processar documentos e fazer buscas</small>
      </div>

      {/* Upload */}
      <input
        ref={fileInputRef}
        id="kb-file-upload"
        type="file"
        accept=".pdf,.txt,.csv,.md,.text"
        onChange={(e) => { handleUpload(e); if (fileInputRef.current) fileInputRef.current.value = '' }}
        disabled={uploading || !form.api_key}
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
      />
      <label
        htmlFor={form.api_key && !uploading ? 'kb-file-upload' : undefined}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.borderColor = '#6366f1' }}
        onDragLeave={(e) => { e.stopPropagation(); e.currentTarget.style.borderColor = '#334155' }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          e.currentTarget.style.borderColor = '#334155'
          if (form.api_key && !uploading && e.dataTransfer.files[0]) {
            handleUpload({ target: { files: [e.dataTransfer.files[0]] } })
          }
        }}
        style={{
          display: 'block',
          padding: '1.25rem',
          borderRadius: '10px',
          border: `2px dashed ${form.api_key ? '#334155' : '#ef444450'}`,
          textAlign: 'center',
          backgroundColor: '#0f172a',
          cursor: form.api_key && !uploading ? 'pointer' : 'not-allowed',
          opacity: form.api_key ? 1 : 0.6,
          transition: 'all 0.15s',
          margin: 0,
        }}
      >
        {uploading ? (
          <>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
            <p style={{ fontSize: '0.82rem', color: '#3b82f6', margin: 0 }}>
              Processando... (extraindo texto, criando chunks e gerando embeddings)
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📄</div>
            <p style={{ fontSize: '0.82rem', color: '#e2e8f0', margin: '0 0 0.25rem', fontWeight: 500 }}>
              {form.api_key ? 'Clique ou arraste um arquivo aqui' : 'Informe a API Key acima primeiro'}
            </p>
            <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>
              PDF, TXT, CSV ou Markdown
            </p>
          </>
        )}
      </label>

      {/* Adicionar texto */}
      <button
        onClick={() => setView('addText')}
        style={{
          ...btnSecondary,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
        }}
      >
        ✏️ Adicionar Texto Manual
      </button>

      {/* Documentos */}
      <div>
        <label style={{ ...labelStyle, marginBottom: '0.4rem', display: 'block' }}>
          Documentos ({documents.length})
        </label>
        {documents.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>
            Nenhum documento ainda. Envie arquivos ou adicione textos acima.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {documents.map((doc) => {
              const status = STATUS_COLORS[doc.status] || STATUS_COLORS.pending
              return (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    fontSize: '0.82rem',
                  }}
                >
                  <span>{doc.source === 'manual' ? '✏️' : '📄'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 500,
                      color: '#f1f5f9',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {doc.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', gap: '0.5rem' }}>
                      {doc.chunk_count > 0 && <span>{doc.chunk_count} chunks</span>}
                      {doc.file_size && <span>{(doc.file_size / 1024).toFixed(0)} KB</span>}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.4rem',
                    borderRadius: '10px',
                    backgroundColor: status.bg,
                    color: status.color,
                  }}>
                    {status.label}
                  </span>
                  {doc.error_message && (
                    <span title={doc.error_message} style={{ cursor: 'help' }}>⚠️</span>
                  )}
                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, fontSize: '0.85rem' }}
                  >
                    🗑️
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Testar busca */}
      {documents.some(d => d.status === 'ready') && (
        <div style={{
          padding: '0.75rem',
          borderRadius: '10px',
          border: '1px solid #334155',
          backgroundColor: '#0f172a',
        }}>
          <label style={{ ...labelStyle, marginBottom: '0.35rem', display: 'block' }}>🔍 Testar Busca</label>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Faça uma pergunta para testar..."
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim() || !form.api_key}
              style={{ ...btnPrimary, padding: '0.4rem 0.75rem', whiteSpace: 'nowrap' }}
            >
              {searching ? '...' : 'Buscar'}
            </button>
          </div>

          {searchResults && (
            <div style={{ marginTop: '0.5rem' }}>
              {searchResults.length === 0 ? (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Nenhum resultado</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {searchResults.map((r, i) => (
                    <div key={i} style={{
                      padding: '0.5rem',
                      borderRadius: '6px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      fontSize: '0.78rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, color: '#f1f5f9' }}>Trecho {i + 1}</span>
                        <span style={{
                          fontSize: '0.68rem',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '8px',
                          backgroundColor: r.score > 0.8 ? 'rgba(34,197,94,0.1)' : r.score > 0.6 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                          color: r.score > 0.8 ? '#22c55e' : r.score > 0.6 ? '#f59e0b' : '#ef4444',
                          fontWeight: 600,
                        }}>
                          {(r.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div style={{ color: '#94a3b8', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {r.content.substring(0, 300)}{r.content.length > 300 ? '...' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Botão Salvar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #334155' }}>
        <button
          onClick={async () => {
            try {
              setError(null)
              const payload = { api_key_ref: form.api_key }
              console.log('Saving KB:', selectedBase.id, payload)
              const res = await api.put(`/api/v1/knowledge/bases/${selectedBase.id}`, payload)
              console.log('Save response:', res.data)
              if (res.data.success) {
                // Atualiza o selectedBase local
                setSelectedBase((prev) => ({ ...prev, api_key_ref: form.api_key }))
                // Feedback
                setSaveStatus('saved')
                setTimeout(() => setSaveStatus(null), 2000)
              } else {
                setError(res.data.error || 'Erro ao salvar')
              }
            } catch (err) {
              console.error('Save error:', err)
              setError('Erro ao salvar')
            }
          }}
          style={btnPrimary}
        >
          {saveStatus === 'saved' ? '✓ Salvo!' : 'Salvar'}
        </button>
      </div>
    </div>
  )

  const renderAddText = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <label style={labelStyle}>Título *</label>
        <input
          type="text"
          value={textForm.name}
          onChange={(e) => setTextForm({ ...textForm, name: e.target.value })}
          placeholder="Ex: Política de Troca, FAQ, Horários"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>Conteúdo *</label>
        <textarea
          value={textForm.text}
          onChange={(e) => setTextForm({ ...textForm, text: e.target.value })}
          placeholder="Cole aqui o texto que deseja adicionar à base de conhecimento..."
          rows={10}
          style={{ ...inputStyle, fontFamily: 'inherit', lineHeight: 1.6 }}
        />
        <small style={helpStyle}>
          {textForm.text.length} caracteres
          {form.chunk_size > 0 && ` · ~${Math.ceil(textForm.text.length / form.chunk_size)} chunks`}
        </small>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <button onClick={() => setView('detail')} style={btnSecondary}>Cancelar</button>
        <button
          onClick={handleAddText}
          disabled={!textForm.text.trim() || !form.api_key || uploading}
          style={{ ...btnPrimary, opacity: textForm.text.trim() && form.api_key ? 1 : 0.5 }}
        >
          {uploading ? 'Processando...' : 'Adicionar'}
        </button>
      </div>
    </div>
  )

  const title = view === 'create' ? 'Nova Base de Conhecimento'
    : view === 'detail' ? selectedBase?.name
    : view === 'addText' ? 'Adicionar Texto'
    : 'Base de Conhecimento'

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 15000,
      }}
    >
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '14px',
        width: '600px',
        maxWidth: '92vw',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #334155',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {(view === 'detail' || view === 'addText') && (
              <button
                onClick={() => {
                  if (view === 'addText') setView('detail')
                  else { setView('list'); setSelectedBase(null) }
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0.2rem' }}
              >
                ←
              </button>
            )}
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
                🧠 {title}
              </h3>
              {view === 'list' && (
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                  Documentos e textos para seus agentes de IA consultarem
                </p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {view === 'list' && bases.length > 0 && (
              <button onClick={() => setView('create')} style={btnPrimary}>+ Nova Base</button>
            )}
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#94a3b8' }}
            >
              &times;
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{
              padding: '0.6rem', backgroundColor: '#FEE2E2', color: '#DC2626',
              borderRadius: '6px', marginBottom: '0.75rem', fontSize: '0.82rem',
            }}>
              {error}
              <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>Carregando...</div>
          ) : (
            <>
              {view === 'list' && renderList()}
              {view === 'create' && renderCreate()}
              {view === 'detail' && renderDetail()}
              {view === 'addText' && renderAddText()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Styles
const inputStyle = {
  width: '100%',
  padding: '0.45rem 0.6rem',
  borderRadius: '6px',
  border: '1px solid var(--border, #334155)',
  backgroundColor: 'var(--bg-input, #1e293b)',
  color: '#e2e8f0',
  fontSize: '0.85rem',
  boxSizing: 'border-box',
  outline: 'none',
}

const labelStyle = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 600,
  color: '#e2e8f0',
  marginBottom: '0.3rem',
}

const helpStyle = {
  display: 'block',
  fontSize: '0.74rem',
  color: '#94a3b8',
  marginTop: '0.2rem',
}

const btnPrimary = {
  padding: '0.45rem 0.9rem',
  backgroundColor: '#6366f1',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.82rem',
  fontWeight: 600,
}

const btnSecondary = {
  padding: '0.45rem 0.9rem',
  backgroundColor: '#0f172a',
  color: '#e2e8f0',
  border: '1px solid #334155',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.82rem',
}

export default KnowledgeBasePanel
