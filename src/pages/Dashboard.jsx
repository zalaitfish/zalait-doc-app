import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, FileText, Undo2, Handshake, ChevronLeft, Bell, TrendingUp, TrendingDown, Plus, Sparkles } from 'lucide-react'
import { getDashboardStats, listDocuments, listAlerts } from '../api/db'

const TYPE_LABEL = { invoice: 'חשבונית', delivery: 'ת. משלוח', credit: 'זיכוי' }

export default function Dashboard() {
  const [stats, setStats] = useState({ totalDocs: 0, pendingCredits: 0, suppliers: 0, openAlerts: 0 })
  const [recent, setRecent] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardStats(), listDocuments(), listAlerts('open')])
      .then(([s, d, a]) => { setStats(s); setRecent(d.slice(0, 4)); setAlerts(a.slice(0, 3)) })
      .catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="bg-white px-5 pt-14 pb-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">דגים זלאיט</h1>
            <p className="text-sm text-gray-400 mt-0.5">ניהול מסמכים</p>
          </div>
          <Link to="/alerts" className="relative w-11 h-11 rounded-full bg-[var(--surface)] flex items-center justify-center">
            <Bell className="w-5 h-5 text-gray-600" />
            {stats.openAlerts > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{stats.openAlerts}</span>}
          </Link>
        </div>
        <Link to="/upload" className="block bg-[var(--brand)] rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><Camera className="w-6 h-6" /></div>
            <div className="flex-1">
              <div className="font-bold text-[15px]">סרוק מסמך חדש</div>
              <div className="text-xs text-white/70 flex items-center gap-1 mt-0.5"><Sparkles className="w-3 h-3" /> זיהוי אוטומטי עם AI</div>
            </div>
            <ChevronLeft className="w-5 h-5 text-white/60" />
          </div>
        </Link>
      </div>
      <div className="px-5 py-4 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <StatCard to="/documents" value={stats.totalDocs} label="מסמכים" color="#0066FF" bg="#EBF2FF" icon={FileText} />
          <StatCard to="/credits" value={stats.pendingCredits} label="זיכויים" color="#E84855" bg="#FFF0F1" icon={Undo2} />
          <StatCard to="/suppliers" value={stats.suppliers} label="ספקים" color="#00B67A" bg="#EDFAF4" icon={Handshake} />
        </div>
        {alerts.length > 0 && (
          <Section title="דורש טיפול" to="/alerts" count={stats.openAlerts}>
            <div className="space-y-2">{alerts.map(a => <AlertMini key={a.id} alert={a} />)}</div>
          </Section>
        )}
        <Section title="אחרונים" to="/documents">
          {loading ? <p className="text-center py-8 text-sm text-gray-400">טוען...</p> : recent.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] flex items-center justify-center mx-auto mb-3"><FileText className="w-7 h-7 text-gray-300" /></div>
              <p className="text-sm text-gray-500 font-medium">עדיין לא העלית מסמכים</p>
              <Link to="/upload" className="text-sm text-[var(--brand)] font-bold mt-2 inline-block">סרוק את הראשון</Link>
            </div>
          ) : (
            <div className="space-y-2">{recent.map(d => (
              <Link key={d.id} to="/documents" className="card flex items-center gap-3 p-3.5">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-50)] flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-[var(--brand)]" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 truncate">{d.supplier?.name || 'ללא ספק'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{TYPE_LABEL[d.type]} • {d.doc_date}</div>
                </div>
                {d.total && <div className="text-sm font-bold text-gray-900">₪{Number(d.total).toLocaleString()}</div>}
              </Link>
            ))}</div>
          )}
        </Section>
      </div>
    </div>
  )
}
function StatCard({ to, value, label, color, bg, icon: Icon }) {
  return (<Link to={to} className="card p-3.5 text-center"><div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{background:bg}}><Icon className="w-5 h-5" style={{color}} /></div><div className="text-2xl font-extrabold text-gray-900">{value}</div><div className="text-[11px] text-gray-400 font-medium mt-0.5">{label}</div></Link>)
}
function Section({ title, to, count, children }) {
  return (<section><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><h2 className="text-base font-bold text-gray-900">{title}</h2>{count > 0 && <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{count}</span>}</div><Link to={to} className="text-xs text-[var(--brand)] font-semibold flex items-center gap-0.5">הכל <ChevronLeft className="w-3.5 h-3.5" /></Link></div>{children}</section>)
}
function AlertMini({ alert }) {
  const data = (() => { try { return JSON.parse(alert.message) } catch { return {} } })()
  const cfg = { price_up: { Icon: TrendingUp, color: '#E84855', bg: '#FFF0F1', label: `+${data.pct_change}%` }, price_down: { Icon: TrendingDown, color: '#00B67A', bg: '#EDFAF4', label: `${data.pct_change}%` }, new_product: { Icon: Plus, color: '#0066FF', bg: '#EBF2FF', label: 'חדש' } }[alert.type] || { Icon: Bell, color: '#F5A623', bg: '#FFF8EB', label: '' }
  return (<Link to="/alerts" className="card flex items-center gap-3 p-3.5"><div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:cfg.bg}}><cfg.Icon className="w-5 h-5" style={{color:cfg.color}} /></div><div className="flex-1 min-w-0"><div className="font-semibold text-sm text-gray-900 truncate">{data.product_name || data.name}</div><div className="text-xs text-gray-400">{alert.document?.supplier?.name}</div></div><span className="text-xs font-bold px-2 py-1 rounded-lg" style={{color:cfg.color,background:cfg.bg}}>{cfg.label}</span></Link>)
}
