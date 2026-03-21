import { useState, useMemo } from 'react'

const WEEKDAY_HEADERS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

function ScheduleBlockedDates({ blockedDates = [], blockWeekends, onToggleDate, onRemoveDate }) {
  const [viewDate, setViewDate] = useState(() => new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDow = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days = []

    // Pad with empty days for alignment
    for (let i = 0; i < startDow; i++) {
      days.push(null)
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dow = new Date(year, month, d).getDay()
      const isWeekend = dow === 0 || dow === 6
      const isBlocked = blockedDates.includes(dateStr)
      const isToday = (() => {
        const now = new Date()
        return now.getFullYear() === year && now.getMonth() === month && now.getDate() === d
      })()

      days.push({ day: d, dateStr, isWeekend, isBlocked, isToday })
    }

    return days
  }, [year, month, blockedDates])

  const monthLabel = new Date(year, month).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  const goToPrevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const goToNextMonth = () => setViewDate(new Date(year, month + 1, 1))

  return (
    <div>
      {/* Calendar navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
      }}>
        <button onClick={goToPrevMonth} style={navBtnStyle}>&lsaquo;</button>
        <span style={{
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--text-primary, #f1f5f9)',
          textTransform: 'capitalize',
        }}>
          {monthLabel}
        </span>
        <button onClick={goToNextMonth} style={navBtnStyle}>&rsaquo;</button>
      </div>

      {/* Weekday headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '2px',
        marginBottom: '4px',
      }}>
        {WEEKDAY_HEADERS.map(d => (
          <div key={d} style={{
            textAlign: 'center',
            fontSize: '0.65rem',
            fontWeight: 600,
            color: 'var(--text-dim, #64748b)',
            padding: '0.2rem 0',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '2px',
      }}>
        {calendarDays.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} />
          }

          const { day, dateStr, isWeekend, isBlocked, isToday } = cell
          const isWeekendBlocked = blockWeekends && isWeekend

          let bg = 'transparent'
          let color = 'var(--text-secondary, #cbd5e1)'
          let border = '1px solid transparent'

          if (isBlocked) {
            bg = 'rgba(239, 68, 68, 0.2)'
            color = '#ef4444'
            border = '1px solid rgba(239, 68, 68, 0.4)'
          } else if (isWeekendBlocked) {
            bg = 'rgba(239, 68, 68, 0.08)'
            color = 'var(--text-dim, #64748b)'
            border = '1px solid rgba(239, 68, 68, 0.15)'
          }

          if (isToday) {
            border = '1px solid var(--accent, #6366f1)'
          }

          return (
            <button
              key={dateStr}
              onClick={() => onToggleDate(dateStr)}
              style={{
                width: '100%',
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: isToday ? 700 : 400,
                backgroundColor: bg,
                color,
                border,
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                padding: 0,
              }}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Blocked dates list */}
      {blockedDates.length > 0 && (
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--text-secondary, #cbd5e1)',
            marginBottom: '0.4rem',
          }}>
            Datas bloqueadas ({blockedDates.length})
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.35rem',
          }}>
            {[...blockedDates].sort().map(date => (
              <div key={date} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.2rem 0.5rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '12px',
                fontSize: '0.72rem',
                color: '#ef4444',
              }}>
                <span>{formatDateBR(date)}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveDate(date) }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const navBtnStyle = {
  background: 'none',
  border: '1px solid var(--border, #334155)',
  borderRadius: '4px',
  color: 'var(--text-secondary, #cbd5e1)',
  cursor: 'pointer',
  fontSize: '1.1rem',
  width: '28px',
  height: '28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'border-color 0.15s',
}

function formatDateBR(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export default ScheduleBlockedDates
