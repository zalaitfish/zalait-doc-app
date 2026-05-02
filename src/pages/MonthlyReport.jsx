import { useEffect, useState } from 'react'
import { BarChart3, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { getMonthlyReport } from '../api/db'
import { EmptyState, ErrorBox, PageHeader } from './Suppliers'

const MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']

export default function MonthlyReport() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [report, setReport] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)

  const load = () => { setLoading(true); getMonthlyReport(year, month).then(setReport).catch(e => setError(e.message)).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [year, month])

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(year - 1) } else setMonth(month - 1) }
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(year + 1) } else setMonth(month + 1) }

  const totalInv = report.reduce((s, r) => s + r.invoices, 0)
  const totalCre = report.reduce((s, r) => s + r.credits, 0)
  const totalBal = totalInv - totalCre

  return (
    <div>
      <PageHeader title="דוח חודשי" subtitle="סיכום לכל ספק" />
      <div className="px-5 space-y-4">
        {/* Month selector */}
        <div className="card flex items-center justify-between p-3">
          <button onClick={nextMonth} className="w-9 h-9 rounded-xl bg-[var(--surface)] flex items-center justify-center"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
          <div className="text-center"><div className="font-bold text-gray-900">{MONTHS[month - 1]}</div><div className="text-xs text-gray-400">{year}</div></div>
          <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-[var(--surface)] flex items-center justify-center"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center"><div className="text-xs text-gray-400">חשבוניות</div><div className="text-lg font-extrabold text-gray-900 mt-1">₪{totalInv.toLocaleString()}</div></div>
          <div className="card p-3 text-center"><div className="text-xs text-gray-400">זיכויים</div><div className="text-lg font-extrabold text-red-500 mt-1">-₪{totalCre.toLocaleString()}</div></div>
          <div className="card p-3 text-center"><div className="text-xs text-gray-400">לתשלום</div><div className="text-lg font-extrabold text-[var(--brand)] mt-1">₪{totalBal.toLocaleString()}</div></div>
        </div>

        {error && <ErrorBox msg={error} />}
        {loading && <p className="text-center text-gray-400 py-8">טוען...</p>}
        {!loading && report.length === 0 && <EmptyState text={`אין מסמכים ב${MONTHS[month - 1]} ${year}`} />}

        {/* Per supplier */}
        {report.map(s => (
          <div key={s.id} className="card overflow-hidden">
            <button onClick={() => setExpanded(expanded === s.id ? null : s.id)} className="w-full p-4 text-right flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[var(--brand-50)] flex items-center justify-center shrink-0"><BarChart3 className="w-5 h-5 text-[var(--brand)]" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-900 truncate">{s.name}</div>
                <div className="text-xs text-gray-400">{s.docs.length} מסמכים</div>
              </div>
              <div className="text-left">
                <div className="font-bold text-sm text-[var(--brand)]">₪{s.balance.toLocaleString()}</div>
                {s.credits > 0 && <div className="text-[10px] text-red-500">-₪{s.credits.toLocaleString()} זיכוי</div>}
              </div>
            </button>
            {expanded === s.id && (
              <div className="border-t border-gray-50 px-4 pb-3">
                {s.docs.map(d => (
                  <div key={d.id} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                    <FileText className="w-4 h-4 text-gray-300 shrink-0" />
                    <div className="flex-1 text-xs text-gray-600">{d.doc_date} • {d.type === 'credit' ? 'זיכוי' : 'חשבונית'} {d.doc_number || ''}</div>
                    <div className={`text-xs font-bold ${d.type === 'credit' ? 'text-red-500' : 'text-gray-900'}`}>{d.type === 'credit' ? '-' : ''}₪{Number(d.total || 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
