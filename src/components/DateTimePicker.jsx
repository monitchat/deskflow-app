import { useState, useRef, useEffect } from 'react'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

function DateTimePicker({ value, onChange, showTime = false, placeholder }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const now = new Date()
  const selected = value ? new Date(value) : null

  const [viewYear, setViewYear] = useState(selected?.getFullYear() || now.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? now.getMonth())
  const [hour, setHour] = useState(selected ? String(selected.getHours()).padStart(2, '0') : '09')
  const [minute, setMinute] = useState(selected ? String(selected.getMinutes()).padStart(2, '0') : '00')

  useEffect(() => {
    if (selected) {
      setHour(String(selected.getHours()).padStart(2, '0'))
      setMinute(String(selected.getMinutes()).padStart(2, '0'))
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const buildDate = (day, h, m) => {
    const d = new Date(viewYear, viewMonth, day, parseInt(h) || 0, parseInt(m) || 0, 0, 0)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const selectDay = (day) => {
    onChange(buildDate(day, hour, minute))
    if (!showTime) setOpen(false)
  }

  const updateTime = (h, m) => {
    setHour(h)
    setMinute(m)
    if (selected) {
      onChange(buildDate(selected.getDate(), h, m))
    }
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

  const pad = (n) => String(n).padStart(2, '0')

  const formatDisplay = () => {
    if (!selected) return null
    const d = selected
    const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
    if (!showTime) return date
    return `${date}  ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  const isSelected = (day) => {
    if (!selected) return false
    return selected.getDate() === day && selected.getMonth() === viewMonth && selected.getFullYear() === viewYear
  }

  const isToday = (day) => {
    return now.getDate() === day && now.getMonth() === viewMonth && now.getFullYear() === viewYear
  }

  const display = formatDisplay()

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          padding: '0.55rem 0.75rem',
          paddingRight: display ? '2.2rem' : '0.75rem',
          backgroundColor: 'var(--bg-input, #0f172a)',
          border: '1px solid var(--border, #334155)',
          borderRadius: '6px',
          color: display ? 'var(--text-primary, #f1f5f9)' : 'var(--text-dim, #64748b)',
          fontSize: '0.82rem',
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
          minHeight: '36px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>&#128197;</span>
        <span>{display || placeholder || 'Selecionar data...'}</span>
      </button>

      {/* Clear */}
      {display && (
        <span
          onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false) }}
          style={{
            position: 'absolute',
            right: '0.6rem',
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            color: 'var(--text-dim, #64748b)',
            fontSize: '1rem',
            lineHeight: 1,
            zIndex: 1,
          }}
          onMouseEnter={(e) => { e.target.style.color = '#ef4444' }}
          onMouseLeave={(e) => { e.target.style.color = 'var(--text-dim, #64748b)' }}
        >
          &times;
        </span>
      )}

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          zIndex: 9999,
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          padding: '0.6rem',
          minWidth: '280px',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
            padding: '0 0.2rem',
          }}>
            <button type="button" onClick={prevMonth} style={navBtnStyle}>&lsaquo;</button>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f1f5f9', textTransform: 'capitalize' }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} style={navBtnStyle}>&rsaquo;</button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '0.2rem' }}>
            {WEEKDAYS.map(d => (
              <div key={d} style={{
                textAlign: 'center',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: '#64748b',
                padding: '0.2rem 0',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const sel = isSelected(day)
              const today = isToday(day)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: sel || today ? 700 : 400,
                    backgroundColor: sel ? '#6366f1' : 'transparent',
                    color: sel ? '#fff' : today ? '#818cf8' : '#cbd5e1',
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={(e) => { if (!sel) e.target.style.backgroundColor = 'rgba(99, 102, 241, 0.15)' }}
                  onMouseLeave={(e) => { if (!sel) e.target.style.backgroundColor = 'transparent' }}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Time selector */}
          {showTime && (
            <div style={{
              marginTop: '0.5rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
            }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', marginRight: '0.3rem' }}>Hora:</span>
              <input
                type="number"
                min={0}
                max={23}
                value={hour}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, '').slice(0, 2)
                  if (parseInt(v) > 23) v = '23'
                  updateTime(v, minute)
                }}
                onBlur={() => setHour(pad(parseInt(hour) || 0))}
                style={timeInputStyle}
              />
              <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1rem' }}>:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={minute}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, '').slice(0, 2)
                  if (parseInt(v) > 59) v = '59'
                  updateTime(hour, v)
                }}
                onBlur={() => setMinute(pad(parseInt(minute) || 0))}
                style={timeInputStyle}
              />
              {/* Quick time buttons */}
              <div style={{ marginLeft: '0.5rem', display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
                {['08:00', '09:00', '12:00', '14:00', '18:00'].map(t => {
                  const [h, m] = t.split(':')
                  const isActive = hour === h && minute === m
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => updateTime(h, m)}
                      style={{
                        padding: '0.15rem 0.35rem',
                        fontSize: '0.68rem',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: isActive ? '#6366f1' : 'rgba(255,255,255,0.06)',
                        color: isActive ? '#fff' : '#94a3b8',
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Confirm button */}
          {showTime && selected && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                marginTop: '0.5rem',
                width: '100%',
                padding: '0.45rem',
                backgroundColor: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              Confirmar
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const navBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#818cf8',
  fontSize: '1.3rem',
  cursor: 'pointer',
  padding: '0.1rem 0.4rem',
  borderRadius: '4px',
  lineHeight: 1,
}

const timeInputStyle = {
  width: '44px',
  height: '34px',
  padding: '0.3rem',
  textAlign: 'center',
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '5px',
  color: '#f1f5f9',
  fontSize: '0.85rem',
  fontWeight: 600,
  fontFamily: 'monospace',
  boxSizing: 'border-box',
}

export default DateTimePicker
