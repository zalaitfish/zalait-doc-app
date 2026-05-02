import { useState } from 'react'
import { Download, FileJson, Trash2, AlertTriangle, Cloud } from 'lucide-react'
import { exportAllAsJson, downloadAllDocFiles } from '../lib/backup'
import { deleteAllDocuments } from '../api/db'
import { ErrorBox, Modal, PageHeader } from './Suppliers'

export default function Settings() {
  const [busy,setBusy]=useState(null); const [progress,setProgress]=useState(null); const [error,setError]=useState(null); const [success,setSuccess]=useState(null); const [showDel,setShowDel]=useState(false)
  const handleJson = async () => { setBusy('json');setError(null);setSuccess(null); try{await exportAllAsJson();setSuccess('קובץ הגיבוי הורד')}catch(e){setError(e.message)}finally{setBusy(null)} }
  const handleFiles = async () => { if(!confirm('להוריד את כל הקבצים?')) return; setBusy('files');setProgress({done:0,total:0}); try{const r=await downloadAllDocFiles((d,t)=>setProgress({done:d,total:t}));setSuccess(`הורדו ${r.downloaded} קבצים`)}catch(e){setError(e.message)}finally{setBusy(null);setProgress(null)} }
  return (
    <div>
      <PageHeader title="הגדרות" subtitle="גיבוי וניהול" />
      <div className="px-5 space-y-5">
        {error&&<ErrorBox msg={error}/>}{success&&<div className="bg-green-50 text-green-700 text-xs p-3 rounded-xl font-medium">{success}</div>}
        <Section title="גיבוי">
          <ActionBtn icon={FileJson} title="גיבוי נתונים (JSON)" desc="ספקים, מסמכים ופריטים" onClick={handleJson} loading={busy==='json'} />
          <ActionBtn icon={Download} title="הורד את כל הקבצים" desc={progress?`${progress.done}/${progress.total}...`:'סריקות למכשיר'} onClick={handleFiles} loading={busy==='files'} />
        </Section>
        <Section title="חיבורים"><div className="px-4 py-4 text-xs text-gray-400 flex items-center gap-2"><Cloud className="w-4 h-4"/>קופת Kaspit, Drive, OCR - בקרוב</div></Section>
        <Section title="אזור מסוכן" danger>
          <button onClick={()=>setShowDel(true)} className="w-full flex items-center gap-3 p-4 text-right"><div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0"><Trash2 className="w-5 h-5 text-red-500"/></div><div className="flex-1"><div className="font-semibold text-sm text-red-600">מחק את כל המסמכים</div><div className="text-xs text-gray-400">פעולה בלתי הפיכה</div></div></button>
        </Section>
        {showDel&&<DeleteModal onClose={()=>setShowDel(false)} onDone={()=>{setShowDel(false);setSuccess('נמחק')}} setError={setError}/>}
      </div>
    </div>
  )
}
function Section({title,children,danger}){return(<div><h3 className={`text-xs font-bold uppercase tracking-wide mb-2 ${danger?'text-red-500':'text-gray-400'}`}>{title}</h3><div className={`card overflow-hidden divide-y divide-gray-50 ${danger?'ring-1 ring-red-100':''}`}>{children}</div></div>)}
function ActionBtn({icon:Icon,title,desc,onClick,loading}){return(<button onClick={onClick} disabled={loading} className="w-full flex items-center gap-3 p-4 text-right disabled:opacity-50"><div className="w-11 h-11 rounded-xl bg-[var(--brand-50)] flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-[var(--brand)]"/></div><div className="flex-1"><div className="font-semibold text-sm text-gray-900">{title}</div><div className="text-xs text-gray-400">{loading?'מעבד...':desc}</div></div></button>)}
function DeleteModal({onClose,onDone,setError}){const[confirm,setConfirm]=useState('');const[busy,setBusy]=useState(false);const req='מחק'
  return(<Modal title="מחיקת כל המסמכים" onClose={onClose}><div className="space-y-4"><div className="bg-red-50 rounded-xl p-3 flex gap-2"><AlertTriangle className="w-5 h-5 text-red-500 shrink-0"/><div className="text-xs text-red-700">פעולה בלתי הפיכה. מומלץ גיבוי לפני.</div></div><div><label className="text-xs font-semibold text-gray-500 block mb-1.5">הקלד "{req}" לאישור:</label><input value={confirm} onChange={e=>setConfirm(e.target.value)} className="w-full px-4 py-3 bg-[var(--surface)] rounded-xl text-sm border-0 focus:ring-2 focus:ring-red-500 focus:outline-none"/></div><div className="flex gap-3"><button onClick={onClose} disabled={busy} className="flex-1 bg-[var(--surface)] text-gray-700 py-3 rounded-xl font-bold text-sm">ביטול</button><button onClick={async()=>{if(confirm!==req)return;setBusy(true);try{await deleteAllDocuments();onDone()}catch(e){setError(e.message);onClose()}}} disabled={confirm!==req||busy} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-30">{busy?'מוחק...':'מחק הכל'}</button></div></div></Modal>)}
