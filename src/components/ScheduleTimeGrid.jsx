import { useMemo } from 'react'

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function ScheduleTimeGrid({ scheduleType, executionTimes = [], weekdays = [], intervalMinutes, startTime, endTime, blockWeekends }) {
  const grid = useMemo(() => {
    const cells = {}

    const startHour = startTime ? parseInt(startTime.split(':')[0], 10) : 0
    const endHour = endTime ? parseInt(endTime.split(':')[0], 10) : 23

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`
        const isBlocked = (blockWeekends && (day === 5 || day === 6))
        const isOutsideWindow = hour < startHour || hour > endHour

        if (isBlocked || isOutsideWindow) {
          cells[key] = 'blocked'
          continue
        }

        if (scheduleType === 'interval' && intervalMinutes) {
          // For interval, show active during execution window
          cells[key] = 'active'
        } else if (scheduleType === 'daily') {
          const hasTimeInHour = executionTimes.some(t => {
            const h = parseInt(t.split(':')[0], 10)
            return h === hour
          })
          cells[key] = hasTimeInHour ? 'active' : 'inactive'
        } else if (scheduleType === 'weekly') {
          const isDaySelected = weekdays.includes(day)
          if (!isDaySelected) {
            cells[key] = 'inactive'
          } else {
            const hasTimeInHour = executionTimes.some(t => {
              const h = parseInt(t.split(':')[0], 10)
              return h === hour
            })
            cells[key] = hasTimeInHour ? 'active' : 'inactive'
          }
        } else {
          cells[key] = 'inactive'
        }
      }
    }

    return cells
  }, [scheduleType, executionTimes, weekdays, intervalMinutes, startTime, endTime, blockWeekends])

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px repeat(7, 1fr)',
        gap: '1px',
        fontSize: '0.65rem',
        minWidth: '320px',
      }}>
        {/* Header row */}
        <div />
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={label} style={{
            textAlign: 'center',
            padding: '0.25rem 0',
            fontWeight: 600,
            color: (blockWeekends && (i === 5 || i === 6))
              ? 'var(--text-dim, #64748b)'
              : 'var(--text-secondary, #cbd5e1)',
            fontSize: '0.7rem',
          }}>
            {label}
          </div>
        ))}

        {/* Hour rows - show every 2 hours for compactness */}
        {HOURS.filter(h => h % 2 === 0).map(hour => (
          <div key={hour} style={{ display: 'contents' }}>
            <div style={{
              textAlign: 'right',
              paddingRight: '0.35rem',
              color: 'var(--text-dim, #64748b)',
              fontSize: '0.6rem',
              lineHeight: '16px',
            }}>
              {String(hour).padStart(2, '0')}h
            </div>
            {Array.from({ length: 7 }, (_, day) => {
              const status = grid[`${day}-${hour}`]
              let bg = 'transparent'
              let border = '1px solid var(--border, #334155)'

              if (status === 'active') {
                bg = 'rgba(99, 102, 241, 0.35)'
                border = '1px solid rgba(99, 102, 241, 0.5)'
              } else if (status === 'blocked') {
                bg = 'rgba(239, 68, 68, 0.1)'
                border = '1px solid rgba(239, 68, 68, 0.2)'
              }

              return (
                <div key={`${day}-${hour}`} style={{
                  height: '14px',
                  backgroundColor: bg,
                  border,
                  borderRadius: '2px',
                  transition: 'background-color 0.15s',
                }} />
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginTop: '0.5rem',
        fontSize: '0.65rem',
        color: 'var(--text-dim, #64748b)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '2px',
            backgroundColor: 'rgba(99, 102, 241, 0.35)',
            border: '1px solid rgba(99, 102, 241, 0.5)',
          }} />
          Ativo
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '2px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }} />
          Bloqueado
        </div>
      </div>
    </div>
  )
}

export default ScheduleTimeGrid
