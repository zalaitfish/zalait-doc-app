import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Plus, Barcode, Check, X } from 'lucide-react'
import { listAlerts, updateAlertStatus, updateProduct, addProduct } from '../api/db'
import { calcSalePrice } from '../lib/priceAnalyzer'
import { EmptyState, ErrorBox, PageHeader } from './Suppliers'

export default function PriceAlerts() {
  const [alerts, setAlerts] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(null); const [busyId, setBusyId] = useState(null)
  const load = () => { setLoading(true); listAlerts('open').then(setAlerts).catch(e=>setError(e.message)).finally(()=>setLoading(false)) }
  useEffect(() => { load() }, [])
  const dismiss = async (id) => { setBusyId(id); try{await updateAlertStatus(id,'dismissed');setAlerts(alerts.filter(a=>a.id!==id))}catch(e){setError(e.message)}finally{setBusyId(null)} }
  const approvePriceChange = async (alert,data,useSug) => { setBusyId(alert.id); try{await updateProduct(alert.product_id,{cost_price:data.new_cost,sale_price:useSug?data.suggested_sale:alert.product.sale_price});await updateAlertStatus(alert.id,'resolved');setAlerts(alerts.filter(a=>a.id!==alert.id))}catch(e){setError(e.message)}finally{setBusyId(null)} }
  const addNewProduct = async (alert,data) => { setBusyId(alert.id); try{await addProduct({name:data.name,code:data.product_code||null,barcode:data.barcode||null,cost_price:data.cost_price,sale_price:data.suggested_sale,last_supplier_id:data.supplier_id});await updateAlertStatus(alert.id,'resolved');setAlerts(alerts.filter(a=>a.id!==alert.id))}catch(e){setError(e.message)}finally{setBusyId(null)} }
  const safeParse = s => { try{return JSON.parse(s)}catch{return {}} }

  return (
    <div>
      <PageHeader title="התראות" subtitle={`${alerts.length} פתוחות`} />
      <div className="px-5 space-y-3">
        {error&&<ErrorBox msg={error}/>}{loading&&<p className="text-center text-gray-400 py-8">טוען...</p>}
        {!loading&&alerts.length===0&&<EmptyState text="אין התראות פתוחות 🎉" />}
        {alerts.map(a => { const data=safeParse(a.message); const busy=busyId===a.id
          if(a.type==='price_up'||a.type==='price_down') { const up=a.type==='price_up'; const cfg=up?{Icon:TrendingUp,color:'#E84855',bg:'#FFF0F1'}:{Icon:TrendingDown,color:'#00B67A',bg:'#EDFAF4'}
            return (<div key={a.id} className="card p-4"><div className="flex items-center gap-3 mb-3"><div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{background:cfg.bg}}><cfg.Icon className="w-5 h-5" style={{color:cfg.color}}/></div><div className="flex-1 min-w-0"><div className="font-semibold text-sm text-gray-900 truncate">{data.product_name}</div><div className="text-xs text-gray-400">{a.document?.supplier?.name}</div></div><span className="text-sm font-bold" style={{color:cfg.color}}>{up?'+':''}{data.pct_change}%</span></div>
              <div className="grid grid-cols-3 gap-2 text-xs bg-[var(--surface)] rounded-xl p-3 mb-3"><div><div className="text-gray-400">עלות ישן</div><div className="font-bold text-gray-700 mt-0.5">₪{data.old_cost}</div></div><div><div className="text-gray-400">עלות חדש</div><div className="font-bold text-gray-700 mt-0.5">₪{data.new_cost}</div></div><div><div className="text-gray-400">מכירה מומלץ</div><div className="font-bold text-[var(--brand)] mt-0.5">₪{data.suggested_sale}</div></div></div>
              <div className="flex gap-2"><button onClick={()=>approvePriceChange(a,data,true)} disabled={busy} className="flex-1 bg-[var(--brand)] text-white py-2.5 rounded-xl text-xs font-bold disabled:opacity-40">אשר + עדכן</button><button onClick={()=>approvePriceChange(a,data,false)} disabled={busy} className="flex-1 bg-[var(--surface)] text-gray-700 py-2.5 rounded-xl text-xs font-bold">רק עלות</button><button onClick={()=>dismiss(a.id)} disabled={busy} className="w-10 bg-[var(--surface)] rounded-xl flex items-center justify-center text-gray-400"><X className="w-4 h-4"/></button></div></div>)
          }
          if(a.type==='new_product') return (<div key={a.id} className="card p-4"><div className="flex items-center gap-3 mb-3"><div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{background:'#EBF2FF'}}><Plus className="w-5 h-5" style={{color:'#0066FF'}}/></div><div className="flex-1 min-w-0"><div className="font-semibold text-sm text-gray-900 truncate">{data.name}</div><div className="text-xs font-semibold" style={{color:'#0066FF'}}>פריט חדש</div></div></div>
            <div className="grid grid-cols-2 gap-2 text-xs bg-[var(--surface)] rounded-xl p-3 mb-3"><div><div className="text-gray-400">עלות</div><div className="font-bold text-gray-700 mt-0.5">₪{data.cost_price}</div></div><div><div className="text-gray-400">מכירה מומלץ</div><div className="font-bold text-[var(--brand)] mt-0.5">₪{data.suggested_sale}</div></div>{data.barcode&&<div className="col-span-2"><div className="text-gray-400">ברקוד</div><div className="font-mono text-gray-700 mt-0.5">{data.barcode}</div></div>}</div>
            <div className="flex gap-2"><button onClick={()=>addNewProduct(a,data)} disabled={busy} className="flex-1 bg-[var(--brand)] text-white py-2.5 rounded-xl text-xs font-bold disabled:opacity-40">הוסף לקטלוג</button><button onClick={()=>dismiss(a.id)} disabled={busy} className="w-10 bg-[var(--surface)] rounded-xl flex items-center justify-center text-gray-400"><X className="w-4 h-4"/></button></div></div>)
          if(a.type==='barcode_change') return (<div key={a.id} className="card p-4"><div className="flex items-center gap-3 mb-3"><div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-amber-50"><Barcode className="w-5 h-5 text-amber-600"/></div><div className="flex-1"><div className="font-semibold text-sm text-gray-900">{data.product_name}</div><div className="text-xs text-amber-600 font-semibold">ברקוד השתנה</div></div></div>
            <div className="text-xs bg-[var(--surface)] rounded-xl p-3 mb-3 font-mono"><div>ישן: {data.old_barcode}</div><div className="font-bold">חדש: {data.new_barcode}</div></div>
            <div className="flex gap-2"><button onClick={async()=>{await updateProduct(a.product_id,{barcode:data.new_barcode});await updateAlertStatus(a.id,'resolved');setAlerts(alerts.filter(x=>x.id!==a.id))}} disabled={busy} className="flex-1 bg-[var(--brand)] text-white py-2.5 rounded-xl text-xs font-bold">עדכן</button><button onClick={()=>dismiss(a.id)} disabled={busy} className="w-10 bg-[var(--surface)] rounded-xl flex items-center justify-center text-gray-400"><X className="w-4 h-4"/></button></div></div>)
          return null
        })}
      </div>
    </div>
  )
}
