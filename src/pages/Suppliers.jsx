import { useEffect, useState } from 'react'
import { Plus, X, Phone, Mail, Calendar } from 'lucide-react'
import { listSuppliers, addSupplier } from '../api/db'

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState(null)
  const load = async () => { setLoading(true); try { setSuppliers(await listSuppliers()) } catch(e) { setError(e.message) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  return (
    <div>
      <PageHeader title="ספקים" subtitle={`${suppliers.length} ספקים`} action={<Btn onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> חדש</Btn>} />
      <div className="px-5 space-y-2">
        {error && <ErrorBox msg={error} />}
        {loading && <p className="text-center text-gray-400 py-8">טוען...</p>}
        {!loading && suppliers.length === 0 && <EmptyState text="אין ספקים. לחץ + להוספה." />}
        {suppliers.map(s => (
          <div key={s.id} className="card p-4">
            <div className="font-semibold text-gray-900">{s.name}</div>
            <div className="flex gap-4 mt-1.5 text-xs text-gray-400 flex-wrap">
              {s.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{s.phone}</span>}
              {s.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{s.email}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />שוטף+{s.payment_terms_days || 30}</span>
            </div>
          </div>
        ))}
      </div>
      {showForm && <SupplierForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
  )
}
function SupplierForm({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', payment_terms_days: 30 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const submit = async (e) => { e.preventDefault(); if(!form.name.trim()) return setError('שם ספק חובה'); setSaving(true); try { await addSupplier(form); onSaved() } catch(e) { setError(e.message); setSaving(false) } }
  return (
    <Modal title="ספק חדש" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="שם הספק *" value={form.name} onChange={v => setForm({...form, name: v})} />
        <Field label="טלפון" value={form.phone} onChange={v => setForm({...form, phone: v})} type="tel" />
        <Field label="אימייל" value={form.email} onChange={v => setForm({...form, email: v})} type="email" />
        <Field label="תנאי תשלום (ימים)" value={form.payment_terms_days} onChange={v => setForm({...form, payment_terms_days: parseInt(v)||0})} type="number" />
        {error && <ErrorBox msg={error} />}
        <button type="submit" disabled={saving} className="w-full bg-[var(--brand)] text-white py-3.5 rounded-2xl font-bold text-sm disabled:opacity-50">{saving ? 'שומר...' : 'שמור ספק'}</button>
      </form>
    </Modal>
  )
}

// === Shared Components (exported) ===
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="bg-white px-5 pt-14 pb-4 mb-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-extrabold text-gray-900">{title}</h1>{subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}</div>
        {action}
      </div>
    </div>
  )
}
export function Btn({ children, onClick, variant = 'primary', disabled, className = '' }) {
  const styles = { primary: 'bg-[var(--brand)] text-white', secondary: 'bg-[var(--surface)] text-gray-700', danger: 'bg-red-500 text-white' }
  return <button onClick={onClick} disabled={disabled} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 ${styles[variant]} ${className}`}>{children}</button>
}
export function Field({ label, value, onChange, type = 'text', ...rest }) {
  return (<label className="block"><span className="text-xs font-semibold text-gray-500 mb-1.5 block">{label}</span><input type={type} value={value||''} onChange={e => onChange(e.target.value)} className="w-full px-4 py-3 bg-[var(--surface)] border-0 rounded-xl focus:ring-2 focus:ring-[var(--brand)] focus:outline-none text-sm" {...rest} /></label>)
}
export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl">
          <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-[var(--surface)] flex items-center justify-center text-gray-500"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
export function ErrorBox({ msg }) { return <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl font-medium">{msg}</div> }
export function EmptyState({ text }) { return <div className="text-center py-16 text-gray-400 text-sm">{text}</div> }
