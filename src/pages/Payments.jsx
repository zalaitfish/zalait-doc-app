import { useEffect, useState } from 'react'
import { Wallet, Clock, Check, AlertTriangle } from 'lucide-react'
import { getUpcomingPayments, markDocPaid } from '../api/db'
import { EmptyState, ErrorBox, PageHeader, Modal, Field } from './Suppliers'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paying, setPaying] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = () => { setLoading(true); getUpcomingPayments().then(setPayments).catch(e => setError(e.message)).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const handlePay = async (docId, payment) => {
    setBusyId(docId); setPaying(null); setError(null)
    try { await markDocPaid(docId, payment); load() }
    catch (e) { setError(e.message) } finally { setBusyId(null) }
  }

  const overdue = payments.filter(p => p.days_left < 0)
  const upcoming = payments.filter(p => p.days_left >= 0 && p.days_left <= 7)
  const later = payments.filter(p => p.days_left > 7)

  return (
    <div>
      <PageHeader title="תשלומים" subtitle={`${payments.length} לא שולמו`} />
      <div className="px-5 space-y-5">
        {error && <ErrorBox msg={error} />}
        {loading && <p className="text-center text-gray-400 py-8">טוען...</p>}
        {!loading && payments.length === 0 && <EmptyState text="אין תשלומים ממתינים 🎉" />}

        {overdue.length > 0 && <PaymentSection title="באיחור" items={overdue} color="#E84855" bg="#FFF0F1" icon={AlertTriangle} onPay={setPaying} busyId={busyId} />}
        {upcoming.length > 0 && <PaymentSection title="השבוע" items={upcoming} color="#F5A623" bg="#FFF8EB" icon={Clock} onPay={setPaying} busyId={busyId} />}
        {later.length > 0 && <PaymentSection title="בהמשך" items={later} color="#0066FF" bg="#EBF2FF" icon={Wallet} onPay={setPaying} busyId={busyId} />}

        {paying && <PayModal doc={paying} onClose={() => setPaying(null)} onPay={handlePay} />}
      </div>
    </div>
  )
}

function PaymentSection({ title, items, color, bg, icon: Icon, onPay, busyId }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: bg }}><Icon className="w-3.5 h-3.5" style={{ color }} /></div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5" style={{ background: bg, color }}>{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map(d => (
          <div key={d.id} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}><Wallet className="w-5 h-5" style={{ color }} /></div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-900 truncate">{d.supplier?.name}</div>
                <div className="text-xs text-gray-400">
                  {d.doc_date} • יעד: {d.due_date_calc}
                  {d.days_left < 0 ? <span className="text-red-500 font-semibold"> (איחור {Math.abs(d.days_left)} ימים)</span> :
                   d.days_left === 0 ? <span className="text-amber-500 font-semibold"> (היום!)</span> :
                   <span> (בעוד {d.days_left} ימים)</span>}
                </div>
              </div>
              <div className="font-bold text-sm text-gray-900">₪{Number(d.total || 0).toLocaleString()}</div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
              <button onClick={() => onPay(d)} disabled={busyId === d.id} className="flex items-center gap-1 text-xs font-bold text-green-600 disabled:opacity-40"><Check className="w-3.5 h-3.5" />סמן כשולם</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function PayModal({ doc, onClose, onPay }) {
  const [form, setForm] = useState({ amount: doc.total || '', paid_at: new Date().toISOString().slice(0, 10), method: 'העברה', reference: '' })
  return (
    <Modal title="רישום תשלום" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-[var(--surface)] rounded-xl p-3 text-sm"><span className="text-gray-400">ספק:</span> <span className="font-bold text-gray-900">{doc.supplier?.name}</span> • <span className="font-bold text-gray-900">₪{Number(doc.total || 0).toLocaleString()}</span></div>
        <Field label="סכום ששולם (₪)" value={form.amount} onChange={v => setForm({ ...form, amount: v })} type="number" />
        <Field label="תאריך תשלום" value={form.paid_at} onChange={v => setForm({ ...form, paid_at: v })} type="date" />
        <Field label="אמצעי תשלום" value={form.method} onChange={v => setForm({ ...form, method: v })} />
        <Field label="אסמכתא" value={form.reference} onChange={v => setForm({ ...form, reference: v })} />
        <button onClick={() => onPay(doc.id, { amount: parseFloat(form.amount) || 0, paid_at: form.paid_at, method: form.method, reference: form.reference })}
          className="w-full bg-green-500 text-white py-3.5 rounded-2xl font-bold text-sm">אשר תשלום</button>
      </div>
    </Modal>
  )
}
