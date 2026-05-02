import { useEffect, useState } from 'react'
import { Undo2, Check, Link2, Clock, FileText } from 'lucide-react'
import { listPendingCredits, listDocuments, markWaitingCredit, linkCreditToInvoice, markCreditHandled, updateDocument } from '../api/db'
import { EmptyState, ErrorBox, PageHeader, Btn, Modal } from './Suppliers'

const STATUS_LABEL = { waiting_credit: 'ממתין לזיכוי', credit_received: 'זיכוי התקבל', resolved: 'טופל' }
const STATUS_COLOR = { waiting_credit: { bg: '#FFF8EB', color: '#F5A623' }, credit_received: { bg: '#EDFAF4', color: '#00B67A' }, resolved: { bg: '#F0F0F5', color: '#666' } }

export default function Credits() {
  const [pending, setPending] = useState([])
  const [credits, setCredits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('pending')
  const [linking, setLinking] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [p, allDocs] = await Promise.all([listPendingCredits(), listDocuments({ type: 'credit' })])
      setPending(p); setCredits(allDocs)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleMarkHandled = async (doc) => {
    setBusyId(doc.id)
    try { await markCreditHandled(doc.id); load() }
    catch (e) { setError(e.message) } finally { setBusyId(null) }
  }

  const handleLink = async (creditId, invoiceId) => {
    setBusyId(creditId); setLinking(null)
    try { await linkCreditToInvoice(creditId, invoiceId); load() }
    catch (e) { setError(e.message) } finally { setBusyId(null) }
  }

  return (
    <div>
      <PageHeader title="תעודות זיכוי" subtitle={`${pending.length} ממתינות`} />
      <div className="px-5 space-y-3">
        <div className="flex gap-2">
          <button onClick={() => setTab('pending')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${tab === 'pending' ? 'bg-[var(--brand)] text-white' : 'bg-white text-gray-500'}`}>ממתינות ({pending.length})</button>
          <button onClick={() => setTab('credits')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${tab === 'credits' ? 'bg-[var(--brand)] text-white' : 'bg-white text-gray-500'}`}>תעודות זיכוי ({credits.length})</button>
        </div>

        {error && <ErrorBox msg={error} />}
        {loading && <p className="text-center text-gray-400 py-8">טוען...</p>}

        {!loading && tab === 'pending' && (
          pending.length === 0 ? <EmptyState text="אין חשבוניות שממתינות לזיכוי" /> :
          pending.map(d => {
            const days = Math.ceil((new Date() - new Date(d.doc_date)) / 86400000)
            return (
              <div key={d.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0"><Clock className="w-5 h-5 text-amber-500" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 truncate">{d.supplier?.name}</div>
                    <div className="text-xs text-gray-400">{d.doc_date} • ממתין {days} ימים</div>
                  </div>
                  {d.total && <div className="font-bold text-sm text-gray-900">₪{Number(d.total).toLocaleString()}</div>}
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                  <button onClick={() => handleMarkHandled(d)} disabled={busyId === d.id} className="flex items-center gap-1 text-xs font-semibold text-green-600 disabled:opacity-40"><Check className="w-3.5 h-3.5" />טופל</button>
                  <button onClick={() => updateDocument(d.id, { status: 'pending' }).then(load)} disabled={busyId === d.id} className="flex items-center gap-1 text-xs font-medium text-gray-400 mr-auto disabled:opacity-40">בטל סימון</button>
                </div>
              </div>
            )
          })
        )}

        {!loading && tab === 'credits' && (
          credits.length === 0 ? <EmptyState text="אין תעודות זיכוי. סרוק תעודת זיכוי במסך הסריקה." /> :
          credits.map(d => {
            const sc = STATUS_COLOR[d.status] || STATUS_COLOR.resolved
            return (
              <div key={d.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: sc.bg }}><Undo2 className="w-5 h-5" style={{ color: sc.color }} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 truncate">{d.supplier?.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: sc.bg, color: sc.color }}>{STATUS_LABEL[d.status] || d.status}</span>
                      <span className="text-xs text-gray-400">{d.doc_date}</span>
                    </div>
                  </div>
                  {d.total && <div className="font-bold text-sm text-gray-900">₪{Number(d.total).toLocaleString()}</div>}
                </div>
                {d.status === 'pending' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                    <button onClick={() => setLinking(d)} className="flex items-center gap-1 text-xs font-semibold text-[var(--brand)]"><Link2 className="w-3.5 h-3.5" />קשר לחשבונית</button>
                    <button onClick={() => handleMarkHandled(d)} disabled={busyId === d.id} className="flex items-center gap-1 text-xs font-semibold text-green-600 disabled:opacity-40"><Check className="w-3.5 h-3.5" />סמן כטופל</button>
                  </div>
                )}
                {d.linked_credit_for && <div className="mt-2 text-xs text-gray-400 flex items-center gap-1"><Link2 className="w-3 h-3" />מקושר לחשבונית</div>}
              </div>
            )
          })
        )}

        {linking && <LinkModal credit={linking} onClose={() => setLinking(null)} onLink={handleLink} />}
      </div>
    </div>
  )
}

function LinkModal({ credit, onClose, onLink }) {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    listDocuments({ supplier_id: credit.supplier_id, type: 'invoice' }).then(setInvoices).finally(() => setLoading(false))
  }, [])
  return (
    <Modal title="קשר לחשבונית מקורית" onClose={onClose}>
      {loading ? <p className="text-center text-gray-400 py-4">טוען...</p> :
        invoices.length === 0 ? <p className="text-sm text-gray-500 text-center py-4">לא נמצאו חשבוניות מספק זה</p> :
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {invoices.map(inv => (
            <button key={inv.id} onClick={() => onLink(credit.id, inv.id)} className="w-full card p-3 text-right flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div className="flex-1"><div className="text-sm font-semibold text-gray-900">{inv.doc_number || 'ללא מספר'}</div><div className="text-xs text-gray-400">{inv.doc_date}</div></div>
              <div className="text-sm font-bold text-gray-700">₪{Number(inv.total || 0).toLocaleString()}</div>
            </button>
          ))}
        </div>
      }
    </Modal>
  )
}
