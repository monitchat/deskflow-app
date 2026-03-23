import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Sankey, Layer, Rectangle,
  PieChart, Pie, Cell,
} from 'recharts'
import api from '../config/axios'
import Header from '../components/Header'
import { useTheme } from '../contexts/ThemeContext'

const COLORS = {
  accent: '#6366f1',
  accentLight: '#818cf8',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  teal: '#14b8a6',
  pink: '#ec4899',
  blue: '#3b82f6',
}

const CHART_COLORS = [
  '#6366f1', '#818cf8', '#3b82f6', '#22c55e',
  '#14b8a6', '#f59e0b', '#ec4899', '#ef4444',
  '#a855f7', '#38bdf8',
]

const styles = {
  page: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: 'var(--bg-page)',
    minHeight: '100vh',
    transition: 'background-color 0.3s',
  },
  container: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-dim)',
    marginTop: '0.25rem',
  },
  backButton: {
    padding: '0.5rem 1rem',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-muted)',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  selector: {
    padding: '0.6rem 1rem',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    fontSize: '0.9rem',
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    minWidth: '280px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  summaryCard: {
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid var(--border)',
    transition: 'all 0.25s ease',
    position: 'relative',
    overflow: 'hidden',
  },
  summaryIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    marginBottom: '0.75rem',
  },
  summaryValue: {
    fontSize: '2rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    lineHeight: 1.1,
  },
  summaryLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-dim)',
    marginTop: '0.35rem',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
    gap: '1.25rem',
    marginBottom: '1.25rem',
  },
  chartCard: {
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid var(--border)',
    transition: 'all 0.25s ease',
  },
  chartTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  fullWidthCard: {
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid var(--border)',
    transition: 'all 0.25s ease',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: 'var(--text-dim)',
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
    opacity: 0.5,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '6rem 0',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid var(--border)',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
}

function CustomTooltip({ active, payload, label, theme }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{
      backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
      border: `1px solid ${theme === 'dark' ? '#475569' : '#e2e8f0'}`,
      borderRadius: '8px',
      padding: '0.75rem 1rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}>
      <p style={{
        color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
        fontWeight: 600,
        fontSize: '0.85rem',
        marginBottom: '0.4rem',
      }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{
          color: entry.color,
          fontSize: '0.8rem',
          margin: '0.15rem 0',
        }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  )
}

function SankeyNode({ x, y, width, height, index, payload }) {
  return (
    <Layer key={`node-${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={CHART_COLORS[index % CHART_COLORS.length]}
        fillOpacity={0.9}
        rx={3}
        ry={3}
      />
      <text
        x={x + width + 8}
        y={y + height / 2}
        textAnchor="start"
        dominantBaseline="middle"
        style={{
          fontSize: '0.75rem',
          fill: 'var(--text-secondary)',
          fontWeight: 500,
        }}
      >
        {payload.name}
      </text>
    </Layer>
  )
}

function SankeyLink({ sourceX, targetX, sourceY, targetY, sourceControlX,
  targetControlX, linkWidth, index }) {
  return (
    <Layer key={`link-${index}`}>
      <path
        d={`
          M${sourceX},${sourceY + linkWidth / 2}
          C${sourceControlX},${sourceY + linkWidth / 2}
            ${targetControlX},${targetY + linkWidth / 2}
            ${targetX},${targetY + linkWidth / 2}
          L${targetX},${targetY - linkWidth / 2}
          C${targetControlX},${targetY - linkWidth / 2}
            ${sourceControlX},${sourceY - linkWidth / 2}
            ${sourceX},${sourceY - linkWidth / 2}
          Z
        `}
        fill={COLORS.accent}
        fillOpacity={0.15}
        stroke={COLORS.accent}
        strokeOpacity={0.3}
        strokeWidth={1}
      />
    </Layer>
  )
}

function Analytics() {
  const [flows, setFlows] = useState([])
  const [selectedFlowId, setSelectedFlowId] = useState('')
  const [summary, setSummary] = useState(null)
  const [nodePerformance, setNodePerformance] = useState([])
  const [sankeyData, setSankeyData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [filterCompanyId, setFilterCompanyId] = useState('')
  const [companyIds, setCompanyIds] = useState([])
  const isMaster = localStorage.getItem('user_is_master') === 'true'
  const navigate = useNavigate()
  const { theme } = useTheme()

  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b'
  const gridColor = theme === 'dark' ? '#1e293b' : '#f1f5f9'

  useEffect(() => {
    loadFlows()
  }, [filterCompanyId])

  async function loadFlows() {
    try {
      const params = isMaster && filterCompanyId ? `?company_id=${filterCompanyId}` : ''
      const { data } = await api.get(`/api/v1/analytics/flows${params}`)
      setFlows(data.data)

      if (isMaster && companyIds.length === 0) {
        const allRes = await api.get('/api/v1/analytics/flows')
        const ids = [...new Set(
          allRes.data.data
            .map(f => f.company_id)
            .filter(Boolean)
        )].sort()
        setCompanyIds(ids)
      }
    } catch (err) {
      console.error('Erro ao carregar fluxos:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadDashboard(flowId) {
    if (!flowId) {
      setSummary(null)
      setNodePerformance([])
      setSankeyData(null)
      return
    }
    setLoadingData(true)
    try {
      const [summaryRes, perfRes, sankeyRes] = await Promise.all([
        api.get(`/api/v1/analytics/flows/${flowId}/summary`),
        api.get(`/api/v1/analytics/flows/${flowId}/node-performance`),
        api.get(`/api/v1/analytics/flows/${flowId}/sankey`),
      ])
      setSummary(summaryRes.data.data)
      setNodePerformance(perfRes.data.data)

      const raw = sankeyRes.data.data
      if (raw.nodes.length > 0 && raw.links.length > 0) {
        const nodeIndex = {}
        const nodes = raw.nodes.map((n, i) => {
          nodeIndex[n.id] = i
          return { name: n.name }
        })
        const links = raw.links
          .filter(l => nodeIndex[l.source] !== undefined && nodeIndex[l.target] !== undefined)
          .filter(l => nodeIndex[l.source] !== nodeIndex[l.target])
          .map(l => ({
            source: nodeIndex[l.source],
            target: nodeIndex[l.target],
            value: l.value,
          }))
        setSankeyData(links.length > 0 ? { nodes, links } : null)
      } else {
        setSankeyData(null)
      }
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err)
    } finally {
      setLoadingData(false)
    }
  }

  function handleFlowChange(e) {
    const id = e.target.value
    setSelectedFlowId(id)
    loadDashboard(id)
  }

  const completionData = summary ? [
    { name: 'Completas', value: summary.completed_runs, color: COLORS.success },
    { name: 'Incompletas', value: summary.total_runs - summary.completed_runs, color: COLORS.danger },
  ] : []

  if (loading) {
    return (
      <div style={styles.page}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <Header />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Header />
      <div style={styles.container}>
        {/* Top bar */}
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.title}>Analytics</h1>
            <p style={styles.subtitle}>Acompanhe a performance dos seus fluxos</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isMaster && (
              <select
                value={filterCompanyId}
                onChange={(e) => {
                  setFilterCompanyId(e.target.value)
                  setSelectedFlowId('')
                  setSummary(null)
                  setNodePerformance([])
                  setSankeyData(null)
                }}
                style={{
                  padding: '0.6rem 1rem',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="">Todas as empresas</option>
                {companyIds.map((cid) => (
                  <option key={cid} value={cid}>Empresa {cid}</option>
                ))}
              </select>
            )}
            <select
              value={selectedFlowId}
              onChange={handleFlowChange}
              style={styles.selector}
            >
              <option value="">Selecione um fluxo...</option>
              {flows.map(flow => (
                <option key={flow.id} value={flow.id}>
                  {flow.name} ({flow.stats.total_runs} execuções)
                </option>
              ))}
            </select>
            <button
              style={styles.backButton}
              onClick={() => navigate('/')}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6366f1'
                e.currentTarget.style.color = '#6366f1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
            >
              ← Voltar
            </button>
          </div>
        </div>

        {/* Empty state */}
        {!selectedFlowId && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📊</div>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Selecione um fluxo para visualizar os dados
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
              Escolha um fluxo no seletor acima para ver métricas de execução, performance dos nós e jornada do usuário.
            </p>
          </div>
        )}

        {/* Loading data */}
        {loadingData && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner} />
          </div>
        )}

        {/* Dashboard content */}
        {selectedFlowId && !loadingData && summary && (
          <>
            {/* Summary cards */}
            <div style={styles.summaryGrid}>
              <div
                style={styles.summaryCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  ...styles.summaryIcon,
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(129, 140, 248, 0.1))',
                }}>
                  🚀
                </div>
                <div style={styles.summaryValue}>{summary.total_runs}</div>
                <div style={styles.summaryLabel}>Total de Execuções</div>
              </div>

              <div
                style={styles.summaryCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(34, 197, 94, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  ...styles.summaryIcon,
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))',
                }}>
                  ✅
                </div>
                <div style={{ ...styles.summaryValue, color: COLORS.success }}>
                  {summary.completed_runs}
                </div>
                <div style={styles.summaryLabel}>Completas</div>
              </div>

              <div
                style={styles.summaryCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  ...styles.summaryIcon,
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))',
                }}>
                  📈
                </div>
                <div style={{ ...styles.summaryValue, color: COLORS.warning }}>
                  {summary.completion_rate}%
                </div>
                <div style={styles.summaryLabel}>Taxa de Conclusão</div>
              </div>

              <div
                style={styles.summaryCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(20, 184, 166, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  ...styles.summaryIcon,
                  background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.15), rgba(20, 184, 166, 0.05))',
                }}>
                  ⏱️
                </div>
                <div style={{ ...styles.summaryValue, color: COLORS.teal }}>
                  {summary.average_duration_seconds}s
                </div>
                <div style={styles.summaryLabel}>Duração Média</div>
              </div>
            </div>

            {/* Charts row */}
            <div style={styles.chartGrid}>
              {/* Node Performance */}
              <div style={styles.chartCard}>
                <div style={styles.chartTitle}>
                  <span style={{ opacity: 0.7 }}>📊</span>
                  Performance dos Nós
                </div>
                {nodePerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={nodePerformance}
                      margin={{ top: 5, right: 10, left: -10, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis
                        dataKey="node_label"
                        tick={{ fill: textColor, fontSize: 11 }}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                        height={80}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fill: textColor, fontSize: 11 }}
                        label={{
                          value: 'Execuções',
                          angle: -90,
                          position: 'insideLeft',
                          style: { fill: textColor, fontSize: 11 },
                        }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fill: textColor, fontSize: 11 }}
                        label={{
                          value: 'Taxa de Erro (%)',
                          angle: 90,
                          position: 'insideRight',
                          style: { fill: textColor, fontSize: 11 },
                        }}
                      />
                      <Tooltip content={<CustomTooltip theme={theme} />} />
                      <Legend
                        wrapperStyle={{ fontSize: '0.8rem', color: textColor, paddingTop: '0.5rem' }}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="total_executions"
                        name="Execuções"
                        fill={COLORS.blue}
                        radius={[4, 4, 0, 0]}
                        fillOpacity={0.8}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="error_rate"
                        name="Taxa de Erro (%)"
                        fill={COLORS.warning}
                        radius={[4, 4, 0, 0]}
                        fillOpacity={0.8}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ ...styles.emptyState, padding: '3rem 1rem' }}>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                      Sem dados de performance disponíveis
                    </p>
                  </div>
                )}
              </div>

              {/* Error nodes + Completion pie */}
              <div style={styles.chartCard}>
                <div style={styles.chartTitle}>
                  <span style={{ opacity: 0.7 }}>🔴</span>
                  Erros e Taxa de Conclusão
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {/* Top errors */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    {summary.top_error_nodes && summary.top_error_nodes.length > 0 ? (
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart
                          data={summary.top_error_nodes}
                          layout="vertical"
                          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                          <XAxis type="number" tick={{ fill: textColor, fontSize: 11 }} />
                          <YAxis
                            dataKey="node_id"
                            type="category"
                            tick={{ fill: textColor, fontSize: 11 }}
                            width={80}
                          />
                          <Tooltip content={<CustomTooltip theme={theme} />} />
                          <Bar
                            dataKey="errors"
                            name="Erros"
                            fill={COLORS.danger}
                            radius={[0, 4, 4, 0]}
                            fillOpacity={0.8}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '160px',
                        color: COLORS.success,
                        fontSize: '0.85rem',
                        fontWeight: 500,
                      }}>
                        ✅ Nenhum erro registrado
                      </div>
                    )}
                  </div>

                  {/* Completion pie */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={completionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {completionData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} fillOpacity={0.85} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                            border: `1px solid ${theme === 'dark' ? '#475569' : '#e2e8f0'}`,
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                          }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: '0.75rem', color: textColor }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Sankey */}
            <div style={styles.fullWidthCard}>
              <div style={styles.chartTitle}>
                <span style={{ opacity: 0.7 }}>🔀</span>
                Jornada do Usuário
              </div>
              {sankeyData ? (
                <ResponsiveContainer width="100%" height={400}>
                  <Sankey
                    data={sankeyData}
                    nodeWidth={12}
                    nodePadding={24}
                    margin={{ top: 20, right: 160, bottom: 20, left: 20 }}
                    node={<SankeyNode />}
                    link={<SankeyLink />}
                  />
                </ResponsiveContainer>
              ) : (
                <div style={{ ...styles.emptyState, padding: '3rem 1rem' }}>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    Sem dados de jornada para exibir
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Analytics
