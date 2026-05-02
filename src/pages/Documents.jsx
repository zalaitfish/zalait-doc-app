import { useEffect, useState } from 'react'
import { FileText, Search, ExternalLink, Trash2, Download } from 'lucide-react'
import { listDocuments, deleteDocument } from '../api/db'
import { downloadFile } from '../lib/backup'
import { EmptyState, ErrorBox, PageHeader } from './Suppliers'

const TYPE_LABEL = { invoice: 'חשבונית', delivery: 'ת. משלוח', credit: 'זיכוי' }
const TYPE_COLOR = { invoice: { bg: '#EBF2FF', color: '#0066FF' }, delivery: { bg: '#EDFAF4', color: '#00B67A' }, credit: { bg: '#FFF0F1', color: '#E84855' } }

export default function Documents() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)
  const load = () => { setLoading(true); listDocuments().then(setDocs).catch(e=>setError(e.message)).finally(()=>setLoading(false)) }
  useEffect(() => { load() }, [])

  const handleDelete = async (doc) => {
    if (!confirm(`למחוק מסמך מ-${doc.supplier?.name||'ספק'}?`)) return
    setBusyId(doc.id); try { await deleteDocument(doc); setDocs(docs.filter(d=>d.id!==doc.id)) } catch(e) { setError(e.message) } finally { setBusyId(null) }
  }
  const handleDownload = async (doc) => {
    if (!doc.file_url) return; setBusyId(doc.id)
    try { const s=(doc.supplier?.name||'doc').replace(/[^\w\u0590-\u05FF -]/g,''); const ext=(doc.file_url.split('.').pop()||'jpg').split('?')[0]; await downloadFile(doc.file_url,`${doc.doc_date}_${s}.${ext}`) } catch(e){setError(e.message)} finally{setBusyId(null)}
  }
  const filtered = docs.filter(d => { if(filter!=='all'&&d.type!==filter) return false; if(search&&!(`${d.doc_number||''} ${d.supplier?.name||''}`).toLowerCase().includes(search.toLowerCase())) return false; return true })

  return (
    <div>
      <PageHeader title="מסמכים" subtitle={`${docs.length} בארכיון`} />
      <div className="px-5 space-y-3">
        <div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="חיפוש..." className="w-full pr-11 pl-4 py-3 bg-white rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-[var(--brand)] focus:outline-none border-0" /></div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[['all','הכל'],['invoice','חשבוניות'],['delivery','תעודות משלוח'],['credit','זיכויים']].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filter===v?'bg-[var(--brand)] text-white shadow-sm':'bg-white text-gray-500'}`}>{l}</button>
          ))}
        </div>
        {error && <ErrorBox msg={error} />}
        {loading && <p className="text-center text-gray-400 py-8">טוען...</p>}
        {!loading && filtered.length===0 && <EmptyState text="אין מסמכים" />}
        {filtered.map(d => {
          const tc = TYPE_COLOR[d.type]||{bg:'#F5F5F5',color:'#666'}
          return (
            <div key={d.id} className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{background:tc.bg}}><FileText className="w-5 h-5" style={{color:tc.color}} /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 truncate">{d.supplier?.name||'ללא ספק'}</div>
                  <div className="flex items-center gap-2 mt-0.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{background:tc.bg,color:tc.color}}>{TYPE_LABEL[d.type]}</span><span className="text-xs text-gray-400">{d.doc_number&&`#${d.doc_number} • `}{d.doc_date}</span></div>
                </div>
                {d.total && <div className="font-bold text-sm text-gray-900">₪{Number(d.total).toLocaleString()}</div>}
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                {d.file_url && <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-500 font-medium"><ExternalLink className="w-3.5 h-3.5" />צפה</a>}
                {d.file_url && <button onClick={()=>handleDownload(d)} disabled={busyId===d.id} className="flex items-center gap-1 text-xs text-gray-500 font-medium disabled:opacity-40"><Download className="w-3.5 h-3.5" />הורד</button>}
                <button onClick={()=>handleDelete(d)} disabled={busyId===d.id} className="flex items-center gap-1 text-xs text-red-500 font-medium mr-auto disabled:opacity-40"><Trash2 className="w-3.5 h-3.5" />מחק</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
