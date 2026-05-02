import { useEffect, useState, useRef } from 'react'
import { Camera, Upload as UploadIcon, FileText, Check, X, Sparkles, AlertCircle } from 'lucide-react'
import { listSuppliers, addDocument, uploadDocFile, addSupplier, addDocumentItems } from '../api/db'
import { extractDocData } from '../api/ocr'
import { analyzeItemsAfterOcr } from '../lib/priceAnalyzer'
import { Field, ErrorBox, PageHeader } from './Suppliers'
import { compressImage } from '../lib/imageCompress'

const DOC_TYPE_LABEL = { invoice: 'חשבונית', delivery: 'תעודת משלוח', credit: 'תעודת זיכוי' }

export default function Upload() {
  const [stage, setStage] = useState('capture')
  const [suppliers, setSuppliers] = useState([])
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [fileUrl, setFileUrl] = useState(null)
  const [ocrData, setOcrData] = useState(null)
  const [form, setForm] = useState({})
  const [error, setError] = useState(null)
  const [savedDoc, setSavedDoc] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(); const cameraRef = useRef()
  useEffect(() => { listSuppliers().then(setSuppliers).catch(e => setError(e.message)) }, [])

  const handleFile = async (f) => {
    if (!f) return; setFile(f); setError(null)
    if (f.type.startsWith('image/')) { const r = new FileReader(); r.onload = e => setPreview(e.target.result); r.readAsDataURL(f) }
    setStage('analyzing')
    try {
      const compressed = await compressImage(f)
      const { url } = await uploadDocFile(compressed); setFileUrl(url)
      let ocr = null
      try { ocr = await extractDocData(url, suppliers) } catch(e) { console.warn('OCR failed:', e.message); setError('זיהוי אוטומטי נכשל - מלא ידנית. ' + e.message) }
      setOcrData(ocr)
      setForm({ type: ocr?.doc_type||'invoice', supplier_id: ocr?.supplier_id||'', supplier_name_hint: ocr?.supplier_name||'', doc_number: ocr?.doc_number||'', doc_date: ocr?.doc_date||new Date().toISOString().slice(0,10), total: ocr?.total||'', vat: ocr?.vat||'' })
      setStage('review')
    } catch(e) { setError(e.message); setStage('capture') }
  }

  const handleSave = async () => {
    if (!form.supplier_id) return setError('יש לבחור ספק'); setSaving(true); setError(null)
    try {
      const doc = await addDocument({ type: form.type, supplier_id: form.supplier_id, doc_number: form.doc_number||null, doc_date: form.doc_date, total: form.total ? parseFloat(form.total) : null, vat: form.vat ? parseFloat(form.vat) : null, file_url: fileUrl, status: 'pending', ocr_raw: ocrData||null })
      if (ocrData?.items?.length) {
        const items = ocrData.items.map(it => ({ document_id: doc.id, product_code: it.product_code||null, barcode: it.barcode||null, name: it.name, qty: it.qty||null, unit: it.unit||null, cost_price: it.cost_price||null, line_total: it.line_total||null }))
        await addDocumentItems(items); await analyzeItemsAfterOcr(ocrData.items, doc.id, form.supplier_id)
      }
      setSavedDoc(doc); setStage('success')
    } catch(e) { setError(e.message) } finally { setSaving(false) }
  }

  const handleAddSupplier = async () => {
    const name = form.supplier_name_hint?.trim(); if (!name) return
    try { const s = await addSupplier({ name }); setSuppliers([...suppliers, s]); setForm({...form, supplier_id: s.id}) } catch(e) { setError(e.message) }
  }

  const reset = () => { setStage('capture'); setFile(null); setPreview(null); setFileUrl(null); setOcrData(null); setForm({}); setSavedDoc(null); setError(null) }

  if (stage === 'success') return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-4"><Check className="w-10 h-10 text-green-500" /></div>
        <h2 className="text-2xl font-extrabold text-gray-900">נשמר בהצלחה!</h2>
        <p className="text-sm text-gray-400 mt-1">המסמך הועלה לארכיון</p>
        {savedDoc?.file_url && <a href={savedDoc.file_url} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-[var(--brand)] font-semibold mt-3">צפה בקובץ</a>}
        <button onClick={reset} className="block w-full mt-6 bg-[var(--brand)] text-white py-3.5 rounded-2xl font-bold text-sm">סרוק מסמך נוסף</button>
      </div>
    </div>
  )

  return (
    <div>
      <PageHeader title="סריקת מסמך" subtitle={stage==='capture'?'צלם או העלה':'בדוק ואשר'} />
      <div className="px-5 space-y-4">
        {stage === 'capture' && <>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={e => handleFile(e.target.files[0])} />
          <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={e => handleFile(e.target.files[0])} />
          <button onClick={() => cameraRef.current?.click()} className="w-full bg-[var(--brand)] text-white rounded-2xl py-10 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center"><Camera className="w-8 h-8" /></div>
            <div className="font-bold text-lg">צלם מסמך</div>
            <div className="text-xs text-white/70 flex items-center gap-1"><Sparkles className="w-3 h-3" /> זיהוי אוטומטי</div>
          </button>
          <button onClick={() => fileRef.current?.click()} className="w-full card py-6 flex flex-col items-center gap-2 text-gray-500">
            <UploadIcon className="w-6 h-6" /><div className="font-semibold text-sm">העלה מהגלריה</div><div className="text-xs text-gray-400">PDF, JPG, PNG</div>
          </button>
        </>}
        {stage === 'analyzing' && (
          <div className="card p-10 text-center">
            {preview && <img src={preview} alt="" className="max-h-32 mx-auto rounded-xl opacity-50 mb-4" />}
            <div className="flex items-center justify-center gap-2 text-[var(--brand)] mb-2"><Sparkles className="w-5 h-5 animate-pulse" /><span className="font-bold text-sm">מנתח את המסמך...</span></div>
            <p className="text-xs text-gray-400">3-10 שניות</p>
          </div>
        )}
        {stage === 'review' && <>
          {preview && <details className="card"><summary className="p-3 text-sm font-semibold cursor-pointer text-gray-600">צפה בתמונה</summary><img src={preview} className="w-full rounded-b-2xl" /></details>}
          {error && <ErrorBox msg={error} />}
          {ocrData && !error && <div className="bg-green-50 rounded-xl p-3 text-xs text-green-700 flex items-center gap-2 font-medium"><Sparkles className="w-4 h-4" /> הנתונים חולצו אוטומטית</div>}
          <SelectField label="סוג מסמך" value={form.type} onChange={v => setForm({...form,type:v})} options={[{value:'invoice',label:'חשבונית'},{value:'delivery',label:'תעודת משלוח'},{value:'credit',label:'תעודת זיכוי'}]} />
          <SelectField label="ספק *" value={form.supplier_id} onChange={v => setForm({...form,supplier_id:v})} options={[{value:'',label:'בחר ספק'},...suppliers.map(s=>({value:s.id,label:s.name}))]} highlight={!form.supplier_id} />
          {form.supplier_name_hint && !form.supplier_id && <div className="bg-amber-50 rounded-xl p-3 text-xs flex items-center justify-between gap-2 font-medium"><span className="text-amber-700"><AlertCircle className="w-3.5 h-3.5 inline ml-1" />ספק חדש: <b>{form.supplier_name_hint}</b></span><button onClick={handleAddSupplier} className="bg-[var(--brand)] text-white px-3 py-1.5 rounded-lg text-xs font-bold">הוסף</button></div>}
          <Field label="מספר מסמך" value={form.doc_number} onChange={v => setForm({...form,doc_number:v})} />
          <Field label="תאריך" value={form.doc_date} onChange={v => setForm({...form,doc_date:v})} type="date" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="סכום (₪)" value={form.total} onChange={v => setForm({...form,total:v})} type="number" />
            <Field label="מע״מ (₪)" value={form.vat} onChange={v => setForm({...form,vat:v})} type="number" />
          </div>
          {ocrData?.items?.length > 0 && <details className="card"><summary className="p-3 text-sm font-semibold cursor-pointer text-gray-600">פריטים ({ocrData.items.length})</summary><div className="px-3 pb-3 space-y-1 text-xs">{ocrData.items.map((it,i) => <div key={i} className="flex justify-between border-b border-gray-50 py-1.5"><span className="truncate text-gray-700">{it.name}</span><span className="text-gray-400 shrink-0 mr-2">{it.qty}×₪{it.cost_price}=₪{it.line_total}</span></div>)}</div></details>}
          <div className="flex gap-3 pt-2">
            <button onClick={reset} disabled={saving} className="flex-1 bg-[var(--surface)] text-gray-700 py-3.5 rounded-2xl font-bold text-sm">ביטול</button>
            <button onClick={handleSave} disabled={!form.supplier_id||saving} className="flex-1 bg-[var(--brand)] text-white py-3.5 rounded-2xl font-bold text-sm disabled:opacity-40">{saving?'שומר...':'שמור'}</button>
          </div>
        </>}
      </div>
    </div>
  )
}
function SelectField({ label, value, onChange, options, highlight }) {
  return (<label className="block"><span className="text-xs font-semibold text-gray-500 mb-1.5 block">{label}</span><select value={value||''} onChange={e=>onChange(e.target.value)} className={`w-full px-4 py-3 rounded-xl text-sm bg-[var(--surface)] border-0 focus:ring-2 focus:ring-[var(--brand)] focus:outline-none ${highlight?'ring-2 ring-amber-400':''}`}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>)
}
