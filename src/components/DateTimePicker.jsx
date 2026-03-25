import { forwardRef } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import { ptBR } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'

registerLocale('pt-BR', ptBR)

const CustomInput = forwardRef(({ value, onClick, onClear, placeholder, style }, ref) => (
  <div style={{ position: 'relative', width: '100%', ...style }}>
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      style={{
        padding: '0.55rem 0.75rem',
        paddingRight: value ? '2rem' : '0.75rem',
        backgroundColor: 'var(--bg-input, #0f172a)',
        border: '1px solid var(--border, #334155)',
        borderRadius: '6px',
        color: value ? 'var(--text-primary, #f1f5f9)' : 'var(--text-dim, #64748b)',
        fontSize: '0.82rem',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        minHeight: '36px',
      }}
    >
      {value || placeholder || 'Selecionar data...'}
    </button>
    {value && onClear && (
      <span
        onClick={(e) => { e.stopPropagation(); onClear() }}
        style={{
          position: 'absolute',
          right: '0.5rem',
          top: '50%',
          transform: 'translateY(-50%)',
          cursor: 'pointer',
          color: 'var(--text-dim, #64748b)',
          fontSize: '0.85rem',
          lineHeight: 1,
          padding: '0.15rem',
          borderRadius: '50%',
        }}
        onMouseEnter={(e) => { e.target.style.color = '#ef4444' }}
        onMouseLeave={(e) => { e.target.style.color = 'var(--text-dim, #64748b)' }}
      >
        &times;
      </span>
    )}
  </div>
))

CustomInput.displayName = 'CustomInput'

function DateTimePicker({ value, onChange, showTime = false, placeholder, dateFormat, style }) {
  const selected = value ? new Date(value) : null

  const handleChange = (date) => {
    if (!date) {
      onChange(null)
      return
    }
    onChange(date.toISOString())
  }

  const handleClear = () => onChange(null)

  const format = dateFormat || (showTime ? 'dd/MM/yyyy  HH:mm' : 'dd/MM/yyyy')

  return (
    <>
      <style>{`
        .dtp-popper .react-datepicker {
          background-color: #1e293b !important;
          border: 1px solid #334155 !important;
          border-radius: 10px !important;
          font-family: inherit !important;
          font-size: 0.82rem !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
        }
        .dtp-popper .react-datepicker__header {
          background-color: #0f172a !important;
          border-bottom: 1px solid #334155 !important;
          border-radius: 10px 10px 0 0 !important;
          padding: 0.5rem 0.3rem 0.3rem !important;
        }
        .dtp-popper .react-datepicker__current-month,
        .dtp-popper .react-datepicker-time__header {
          color: #f1f5f9 !important;
          font-weight: 600 !important;
          font-size: 0.88rem !important;
          text-transform: capitalize !important;
        }
        .dtp-popper .react-datepicker__day-name {
          color: #64748b !important;
          font-weight: 600 !important;
          width: 2rem !important;
          line-height: 2rem !important;
          margin: 0.1rem !important;
        }
        .dtp-popper .react-datepicker__day {
          color: #cbd5e1 !important;
          width: 2rem !important;
          line-height: 2rem !important;
          margin: 0.1rem !important;
          border-radius: 6px !important;
        }
        .dtp-popper .react-datepicker__day:hover {
          background-color: rgba(99, 102, 241, 0.2) !important;
          color: #f1f5f9 !important;
        }
        .dtp-popper .react-datepicker__day--selected,
        .dtp-popper .react-datepicker__day--keyboard-selected {
          background-color: #6366f1 !important;
          color: #fff !important;
          font-weight: 600 !important;
        }
        .dtp-popper .react-datepicker__day--today {
          font-weight: 700 !important;
          color: #818cf8 !important;
        }
        .dtp-popper .react-datepicker__day--today.react-datepicker__day--selected {
          color: #fff !important;
        }
        .dtp-popper .react-datepicker__day--outside-month {
          color: #334155 !important;
        }
        .dtp-popper .react-datepicker__navigation {
          top: 0.6rem !important;
        }
        .dtp-popper .react-datepicker__navigation-icon::before {
          border-color: #818cf8 !important;
          border-width: 2px 2px 0 0 !important;
          height: 7px !important;
          width: 7px !important;
        }
        .dtp-popper .react-datepicker__time-container {
          border-left: 1px solid #334155 !important;
          width: 90px !important;
        }
        .dtp-popper .react-datepicker__time-container .react-datepicker__time {
          background-color: #1e293b !important;
          border-bottom-right-radius: 10px !important;
        }
        .dtp-popper .react-datepicker__time-list-item {
          color: #cbd5e1 !important;
          height: auto !important;
          padding: 0.3rem 0.5rem !important;
          font-size: 0.78rem !important;
        }
        .dtp-popper .react-datepicker__time-list-item:hover {
          background-color: rgba(99, 102, 241, 0.2) !important;
          color: #f1f5f9 !important;
        }
        .dtp-popper .react-datepicker__time-list-item--selected {
          background-color: #6366f1 !important;
          color: #fff !important;
          font-weight: 600 !important;
        }
        .dtp-popper .react-datepicker__triangle {
          display: none !important;
        }
      `}</style>
      <DatePicker
        selected={selected}
        onChange={handleChange}
        showTimeSelect={showTime}
        timeFormat="HH:mm"
        timeIntervals={15}
        timeCaption="Hora"
        dateFormat={format}
        locale="pt-BR"
        placeholderText={placeholder}
        customInput={<CustomInput onClear={handleClear} style={style} />}
        popperClassName="dtp-popper"
        popperPlacement="bottom-start"
      />
    </>
  )
}

export default DateTimePicker
