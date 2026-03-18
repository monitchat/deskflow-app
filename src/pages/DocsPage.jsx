import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import Header from '../components/Header'

function DocsPage() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/docs/guia-flow-builder.md')
      .then((res) => res.text())
      .then((text) => {
        setContent(text)
        setLoading(false)
      })
      .catch(() => {
        setContent('# Erro ao carregar documentação')
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'var(--bg-page)' }}>
      <Header />
      <style>{`
        .docs-container {
          max-width: 820px;
          margin: 0 auto;
          padding: 2rem 2.5rem 4rem;
          color: var(--text-primary, #e2e8f0);
          font-size: 0.95rem;
          line-height: 1.8;
        }
        .docs-container h1 {
          font-size: 2rem;
          font-weight: 800;
          margin: 0 0 0.5rem;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.02em;
        }
        .docs-container h2 {
          font-size: 1.4rem;
          font-weight: 700;
          margin: 2.5rem 0 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border, #334155);
          color: var(--text-primary, #f1f5f9);
        }
        .docs-container h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 2rem 0 0.75rem;
          color: var(--text-primary, #e2e8f0);
        }
        .docs-container h4 {
          font-size: 1rem;
          font-weight: 600;
          margin: 1.5rem 0 0.5rem;
          color: var(--text-primary, #cbd5e1);
        }
        .docs-container p {
          margin: 0 0 1rem;
          color: var(--text-dim, #94a3b8);
        }
        .docs-container strong {
          color: var(--text-primary, #e2e8f0);
        }
        .docs-container a {
          color: #818cf8;
          text-decoration: none;
        }
        .docs-container a:hover {
          text-decoration: underline;
        }
        .docs-container ul, .docs-container ol {
          margin: 0 0 1rem;
          padding-left: 1.5rem;
          color: var(--text-dim, #94a3b8);
        }
        .docs-container li {
          margin-bottom: 0.35rem;
        }
        .docs-container code {
          background: rgba(99, 102, 241, 0.12);
          color: #a5b4fc;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-size: 0.88em;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }
        .docs-container pre {
          background: #0f172a;
          border: 1px solid var(--border, #1e293b);
          border-radius: 10px;
          padding: 1rem 1.25rem;
          overflow-x: auto;
          margin: 0 0 1.25rem;
          font-size: 0.85rem;
          line-height: 1.6;
        }
        .docs-container pre code {
          background: none;
          padding: 0;
          color: #a5b4fc;
          font-size: 0.85rem;
        }
        .docs-container table {
          width: 100%;
          border-collapse: collapse;
          margin: 0 0 1.25rem;
          font-size: 0.88rem;
        }
        .docs-container thead th {
          text-align: left;
          padding: 0.6rem 0.75rem;
          background: rgba(99, 102, 241, 0.08);
          border-bottom: 2px solid var(--border, #334155);
          color: var(--text-primary, #e2e8f0);
          font-weight: 600;
          font-size: 0.82rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .docs-container tbody td {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid var(--border, #1e293b);
          color: var(--text-dim, #94a3b8);
        }
        .docs-container tbody tr:hover {
          background: rgba(99, 102, 241, 0.04);
        }
        .docs-container hr {
          border: none;
          border-top: 1px solid var(--border, #334155);
          margin: 2.5rem 0;
        }
        .docs-container blockquote {
          border-left: 3px solid #6366f1;
          margin: 0 0 1rem;
          padding: 0.5rem 1rem;
          background: rgba(99, 102, 241, 0.06);
          border-radius: 0 8px 8px 0;
          color: var(--text-dim, #94a3b8);
        }
      `}</style>

      <div className="docs-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
            Carregando documentação...
          </div>
        ) : (
          <ReactMarkdown>{content}</ReactMarkdown>
        )}
      </div>
    </div>
  )
}

export default DocsPage
