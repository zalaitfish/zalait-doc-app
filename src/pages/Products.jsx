import { useEffect, useState } from 'react'
import { Fish, Search, Edit2, Trash2, Plus } from 'lucide-react'
import { listProducts, updateProduct, deleteProduct, addProduct } from '../api/db'
import { calcMargin, calcSalePrice } from '../lib/priceAnalyzer'
import { Field, Modal, ErrorBox, EmptyState, PageHeader, Btn } from './Suppliers'

export default function Products() {
  const [products, setProducts] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(null); const [search, setSearch] = useState(''); const [editing, setEditing] = useState(null); const [adding, setAdding] = useState(false)
  const load = () => { setLoading(true); listProducts().then(setProducts).catch(e=>setError(e.message)).finally(()=>setLoading(false)) }
  useEffect(() => { load() }, [])
  const handleDelete = async p => { if(!confirm(`למחוק "${p.name}"?`)) return; try{await deleteProduct(p.id);setProducts(products.filter(x=>x.id!==p.id))}catch(e){setError(e.message)} }
  const filtered = products.filter(p=>!search||`${p.name} ${p.code||''} ${p.barcode||''}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <PageHeader title="פריטים" subtitle={`${products.length} בקטלוג`} action={<Btn onClick={()=>setAdding(true)}><Plus className="w-4 h-4"/>חדש</Btn>} />
      <div className="px-5 space-y-3">
        <div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="חיפוש..." className="w-full pr-11 pl-4 py-3 bg-white rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-[var(--brand)] focus:outline-none border-0"/></div>
        {error&&<ErrorBox msg={error}/>}{loading&&<p className="text-center text-gray-400 py-8">טוען...</p>}
        {!loading&&filtered.length===0&&<EmptyState text="אין פריטים" />}
        {filtered.map(p => { const margin=calcMargin(p.cost_price,p.sale_price); const mColor=margin>=20?'#00B67A':margin>=10?'#F5A623':'#E84855'
          return (<div key={p.id} className="card p-4">
            <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-[var(--brand-50)] flex items-center justify-center shrink-0"><Fish className="w-5 h-5 text-[var(--brand)]"/></div><div className="flex-1 min-w-0"><div className="font-semibold text-sm text-gray-900 truncate">{p.name}</div><div className="text-xs text-gray-400 truncate">{p.code&&`מק"ט: ${p.code}`}{p.code&&p.barcode&&' • '}{p.barcode&&`ברקוד: ${p.barcode}`}</div></div></div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs bg-[var(--surface)] rounded-xl p-3"><div><div className="text-gray-400">עלות</div><div className="font-bold text-gray-700 mt-0.5">₪{p.cost_price||'-'}</div></div><div><div className="text-gray-400">מכירה</div><div className="font-bold text-gray-700 mt-0.5">₪{p.sale_price||'-'}</div></div><div><div className="text-gray-400">רווח</div><div className="font-bold mt-0.5" style={{color:mColor}}>{margin!==null?`${margin}%`:'-'}</div></div></div>
            <div className="flex gap-3 mt-3 pt-3 border-t border-gray-50"><button onClick={()=>setEditing(p)} className="flex items-center gap-1 text-xs text-gray-500 font-medium"><Edit2 className="w-3.5 h-3.5"/>ערוך</button><button onClick={()=>handleDelete(p)} className="flex items-center gap-1 text-xs text-red-500 font-medium mr-auto"><Trash2 className="w-3.5 h-3.5"/>מחק</button></div>
          </div>)
        })}
      </div>
      {(editing||adding)&&<ProductForm product={editing} onClose={()=>{setEditing(null);setAdding(false)}} onSaved={()=>{setEditing(null);setAdding(false);load()}} />}
    </div>
  )
}
function ProductForm({ product, onClose, onSaved }) {
  const [form, setForm] = useState(product||{name:'',code:'',barcode:'',cost_price:'',sale_price:'',target_margin_pct:30}); const [saving,setSaving]=useState(false); const [error,setError]=useState(null)
  const submit = async e => { e.preventDefault(); if(!form.name?.trim()) return setError('שם חובה'); setSaving(true); try{ const d={name:form.name.trim(),code:form.code||null,barcode:form.barcode||null,cost_price:form.cost_price?parseFloat(form.cost_price):null,sale_price:form.sale_price?parseFloat(form.sale_price):null,target_margin_pct:form.target_margin_pct||30}; if(product) await updateProduct(product.id,d); else await addProduct(d); onSaved() }catch(e){setError(e.message);setSaving(false)} }
  const suggestSale = () => { const s=calcSalePrice(parseFloat(form.cost_price),form.target_margin_pct||30); if(s) setForm({...form,sale_price:s}) }
  return (<Modal title={product?'ערוך פריט':'פריט חדש'} onClose={onClose}><form onSubmit={submit} className="space-y-4">
    <Field label="שם *" value={form.name} onChange={v=>setForm({...form,name:v})} />
    <div className="grid grid-cols-2 gap-3"><Field label='מק"ט' value={form.code} onChange={v=>setForm({...form,code:v})}/><Field label="ברקוד" value={form.barcode} onChange={v=>setForm({...form,barcode:v})}/></div>
    <div className="grid grid-cols-2 gap-3"><Field label="מחיר עלות" value={form.cost_price} onChange={v=>setForm({...form,cost_price:v})} type="number"/><Field label="מחיר מכירה" value={form.sale_price} onChange={v=>setForm({...form,sale_price:v})} type="number"/></div>
    <Field label="יעד רווח (%)" value={form.target_margin_pct} onChange={v=>setForm({...form,target_margin_pct:parseFloat(v)||30})} type="number"/>
    <button type="button" onClick={suggestSale} className="text-xs text-[var(--brand)] font-semibold">חשב מחיר מכירה לפי יעד</button>
    {error&&<ErrorBox msg={error}/>}
    <button type="submit" disabled={saving} className="w-full bg-[var(--brand)] text-white py-3.5 rounded-2xl font-bold text-sm disabled:opacity-50">{saving?'שומר...':'שמור'}</button>
  </form></Modal>)
}
