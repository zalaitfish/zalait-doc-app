import { useEffect, useState } from 'react'
import { Search, FileText, ExternalLink, Filter, X } from 'lucide-react'
import { searchArchive, listSuppliers } from '../api/db'
import { EmptyState, ErrorBox, PageHeader } from './Suppliers'

const TYPE_LABEL = { invoice: 'חשבונית', delivery: 'ת. משלוח', credit: 'זיכוי' }
const TYPE_COLOR = { invoice: { bg: '#EBF2FF', color: '#0066FF' }, delivery: { bg: '#EDFAF4', color: '#00B67A' }, credit: { bg: '#FFF0F1', color: '#E84855' } }

export default function Archive() {
  const [results, setResults] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ type: '', supplier_id: '', from_date: '', to_date: '' })
  const [searched, setSearched] = useState(false)

  useEffect(() => { listSuppliers().then(setSuppliers).catch(console.error) }, [])

  const doSearch = async () => {
    if (!query && !filters.type && !filters.supplier_id && !filters.from_date) return
    setLoading(true); setError(null); setSearched(true)
    try { setResults(await searchArchive(query, filters)) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const clearFilters = () => { setFilters({ type: '', supplier_id: '', from_date: '', to_date: '' }); setQuery(''); setSearched(false); setResults([]) }
  const hasFilters = filters.type || filters.supplier_id || filters.from_date || filters.to_date

  return (
    <div>
      <PageHeader title="ארכיון" subtitle="חיפוש בכל המסמכים" />
      <div className="px-5 space-y-3">
        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="חיפוש בתוכן, מספר מסמך..."
              className="w-full pr-11 pl-4 py-3 bg-white rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-[var(--brand)] focus:outline-none border-0" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${hasFilters ? 'bg-[var(--brand)] text-white' : 'bg-white text-gray-500 shadow-sm'}`}>
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">סינון</span>
              {hasFilters && <button onClick={clearFilters} className="text-xs text-red-500 font-semibold flex items-center gap-1"><X className="w-3 h-3" />נקה</button>}
            </div>
            <label className="block">
              <span className="text-xs text-gray-500 font-semibold">סוג</span>
              <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 bg-[var(--surface)] rounded-xl text-sm border-0">
                <option value="">הכל</option><option value="invoice">חשבוניות</option><option value="delivery">תעודות משלוח</option><option value="credit">זיכויים</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-gray-500 font-semibold">ספק</span>
              <select value={filters.supplier_id} onChange={e => setFilters({ ...filters, supplier_id: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 bg-[var(--surface)] rounded-xl text-sm border-0">
                <option value="">כל הספקים</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block"><span className="text-xs text-gray-500 font-semibold">מתאריך</span><input type="date" value={filters.from_date} onChange={e => setFilters({ ...filters, from_date: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-[var(--surface)] rounded-xl text-sm border-0" /></label>
              <label className="block"><span className="text-xs text-gray-500 font-semibold">עד תאריך</span><input type="date" value={filters.to_date} onChange={e => setFilters({ ...filters, to_date: e.target.value })} className="w-full mt-1 px-3 py-2.5 bg-[var(--surface)] rounded-xl text-sm border-0" /></label>
            </div>
          </div>
        )}

        <button onClick={doSearch} disabled={loading} className="w-full bg-[var(--brand)] text-white py-3 rounded-2xl font-bold text-sm disabled:opacity-50">
          {loading ? 'מחפש...' : 'חפש'}
        </button>

        {error && <ErrorBox msg={error} />}

        {searched && !loading && results.length === 0 && <EmptyState text="לא נמצאו תוצאות" />}

        {results.map(d => {
          const tc = TYPE_COLOR[d.type] || { bg: '#F5F5F5', color: '#666' }
          return (
            <div key={d.id} className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: tc.bg }}><FileText className="w-5 h-5" style={{ color: tc.color }} /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 truncate">{d.supplier?.name || 'ללא ספק'}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: tc.bg, color: tc.color }}>{TYPE_LABEL[d.type]}</span>
                    <span className="text-xs text-gray-400">{d.doc_number && `#${d.doc_number} • `}{d.doc_date}</span>
                  </div>
                </div>
                <div className="text-left">
                  {d.total && <div className="font-bold text-sm text-gray-900">₪{Number(d.total).toLocaleString()}</div>}
                  {d.file_url && <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-[var(--brand)] inline-block mt-1"><ExternalLink className="w-3.5 h-3.5" /></a>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
