import { supabase } from './supabase'

// === Suppliers ===
export const listSuppliers = async () => { const{data,error}=await supabase.from('suppliers').select('*').order('name');if(error)throw error;return data||[] }
export const addSupplier = async (s) => { const{data,error}=await supabase.from('suppliers').insert(s).select().single();if(error)throw error;return data }
export const deleteSupplier = async (id) => { const{error}=await supabase.from('suppliers').delete().eq('id',id);if(error)throw error }

// === Documents ===
export const listDocuments = async (filters={}) => {
  let q=supabase.from('documents').select('*, supplier:suppliers(id,name)').order('doc_date',{ascending:false}).limit(500)
  if(filters.type) q=q.eq('type',filters.type)
  if(filters.supplier_id) q=q.eq('supplier_id',filters.supplier_id)
  const{data,error}=await q;if(error)throw error;return data||[]
}
export const addDocument = async (doc) => { const{data,error}=await supabase.from('documents').insert(doc).select().single();if(error)throw error;return data }
export const updateDocument = async (id, updates) => { const{data,error}=await supabase.from('documents').update(updates).eq('id',id).select().single();if(error)throw error;return data }
export const deleteDocument = async (doc) => { if(doc.file_url){const path=extractStoragePath(doc.file_url);if(path)await supabase.storage.from('documents').remove([path])} const{error}=await supabase.from('documents').delete().eq('id',doc.id);if(error)throw error }
export const deleteAllDocuments = async () => { const{data:docs}=await supabase.from('documents').select('file_url');const paths=(docs||[]).map(d=>extractStoragePath(d.file_url)).filter(Boolean);for(let i=0;i<paths.length;i+=100){if(paths.length)await supabase.storage.from('documents').remove(paths.slice(i,i+100))} const{error}=await supabase.from('documents').delete().neq('id','00000000-0000-0000-0000-000000000000');if(error)throw error }
const extractStoragePath = (url) => { if(!url)return null;const m=url.match(/\/storage\/v1\/object\/public\/documents\/(.+)$/);return m?decodeURIComponent(m[1]):null }

// === Storage ===
export const uploadDocFile = async (file) => { const ext=(file.name.split('.').pop()||'jpg').toLowerCase();const fileName=`${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;const path=`${new Date().getFullYear()}/${fileName}`;const{error}=await supabase.storage.from('documents').upload(path,file,{cacheControl:'3600'});if(error)throw error;const{data}=supabase.storage.from('documents').getPublicUrl(path);return{path,url:data.publicUrl} }

// === Document Items ===
export const addDocumentItems = async (items) => { if(!items?.length)return[];const{data,error}=await supabase.from('document_items').insert(items).select();if(error)throw error;return data }

// === Products ===
export const listProducts = async () => { const{data,error}=await supabase.from('products').select('*').order('name');if(error)throw error;return data||[] }
export const addProduct = async (p) => { const{data,error}=await supabase.from('products').insert(p).select().single();if(error)throw error;return data }
export const updateProduct = async (id, updates) => { const{data,error}=await supabase.from('products').update({...updates,last_updated:new Date().toISOString()}).eq('id',id).select().single();if(error)throw error;return data }
export const deleteProduct = async (id) => { const{error}=await supabase.from('products').delete().eq('id',id);if(error)throw error }
export const findMatchingProduct = async ({barcode,product_code,name}) => { if(barcode){const{data}=await supabase.from('products').select('*').eq('barcode',barcode).maybeSingle();if(data)return data} if(product_code){const{data}=await supabase.from('products').select('*').eq('code',product_code).maybeSingle();if(data)return data} if(name){const{data}=await supabase.from('products').select('*').ilike('name',name).maybeSingle();if(data)return data} return null }

// === Price History ===
export const addPriceHistory = async (entry) => { const{error}=await supabase.from('price_history').insert(entry);if(error)throw error }

// === Alerts ===
export const listAlerts = async (status='open') => { const{data,error}=await supabase.from('alerts').select('*, product:products(*), document:documents(doc_number,doc_date,supplier:suppliers(name))').eq('status',status).order('created_at',{ascending:false});if(error)throw error;return data||[] }
export const addAlert = async (alert) => { const{data,error}=await supabase.from('alerts').insert(alert).select().single();if(error)throw error;return data }
export const updateAlertStatus = async (id, status) => { const{error}=await supabase.from('alerts').update({status}).eq('id',id);if(error)throw error }

// === Credits ===
export const listPendingCredits = async () => {
  const{data,error}=await supabase.from('documents').select('*, supplier:suppliers(id,name)').eq('status','waiting_credit').order('doc_date',{ascending:false})
  if(error)throw error;return data||[]
}
export const markWaitingCredit = async (docId) => updateDocument(docId, { status: 'waiting_credit' })
export const linkCreditToInvoice = async (creditId, invoiceId) => {
  await updateDocument(creditId, { linked_credit_for: invoiceId, status: 'resolved' })
  await updateDocument(invoiceId, { status: 'credit_received' })
}
export const markCreditHandled = async (docId) => updateDocument(docId, { status: 'resolved' })

// === Payments ===
export const addPayment = async (p) => { const{data,error}=await supabase.from('payments').insert(p).select().single();if(error)throw error;return data }
export const getUpcomingPayments = async () => {
  const{data,error}=await supabase.from('documents').select('*, supplier:suppliers(id,name,payment_terms_days)').eq('payment_status','unpaid').in('type',['invoice','delivery']).order('doc_date')
  if(error)throw error
  return (data||[]).map(d => {
    const terms=d.supplier?.payment_terms_days||30; const dd=new Date(d.doc_date); const due=new Date(dd); due.setDate(due.getDate()+terms)
    return{...d, due_date_calc:due.toISOString().slice(0,10), days_left:Math.ceil((due-new Date())/(86400000))}
  }).sort((a,b)=>a.days_left-b.days_left)
}
export const markDocPaid = async (docId, payment) => {
  await addPayment({document_id:docId,...payment}); await updateDocument(docId,{payment_status:'paid'})
}

// === Monthly Report ===
export const getMonthlyReport = async (year, month) => {
  const start=`${year}-${String(month).padStart(2,'0')}-01`
  const em=month===12?1:month+1; const ey=month===12?year+1:year
  const end=`${ey}-${String(em).padStart(2,'0')}-01`
  const{data,error}=await supabase.from('documents').select('*, supplier:suppliers(id,name)').gte('doc_date',start).lt('doc_date',end).in('type',['invoice','delivery','credit']).order('supplier_id').order('doc_date')
  if(error)throw error
  const suppliers={}
  for(const doc of(data||[])){const sid=doc.supplier_id||'x';const sn=doc.supplier?.name||'ללא ספק';if(!suppliers[sid])suppliers[sid]={id:sid,name:sn,invoices:0,credits:0,docs:[]};const amt=Number(doc.total||0);if(doc.type==='credit')suppliers[sid].credits+=amt;else suppliers[sid].invoices+=amt;suppliers[sid].docs.push(doc)}
  return Object.values(suppliers).map(s=>({...s,balance:s.invoices-s.credits})).sort((a,b)=>b.balance-a.balance)
}

// === Archive ===
export const searchArchive = async (query, filters={}) => {
  let q=supabase.from('documents').select('*, supplier:suppliers(id,name)').order('doc_date',{ascending:false}).limit(100)
  if(query) q=q.or(`ocr_text.ilike.%${query}%,doc_number.ilike.%${query}%`)
  if(filters.type) q=q.eq('type',filters.type)
  if(filters.supplier_id) q=q.eq('supplier_id',filters.supplier_id)
  if(filters.from_date) q=q.gte('doc_date',filters.from_date)
  if(filters.to_date) q=q.lte('doc_date',filters.to_date)
  const{data,error}=await q;if(error)throw error;return data||[]
}

// === Dashboard ===
export const getDashboardStats = async () => {
  const[docs,credits,suppliers,openAlerts,unpaid]=await Promise.all([
    supabase.from('documents').select('id',{count:'exact',head:true}),
    supabase.from('documents').select('id',{count:'exact',head:true}).eq('status','waiting_credit'),
    supabase.from('suppliers').select('id',{count:'exact',head:true}),
    supabase.from('alerts').select('id',{count:'exact',head:true}).eq('status','open'),
    supabase.from('documents').select('id',{count:'exact',head:true}).eq('payment_status','unpaid').in('type',['invoice','delivery'])
  ])
  return{totalDocs:docs.count||0,pendingCredits:credits.count||0,suppliers:suppliers.count||0,openAlerts:openAlerts.count||0,unpaidDocs:unpaid.count||0}
}
export const fetchAllForBackup = async () => { const[suppliers,documents,items,products]=await Promise.all([supabase.from('suppliers').select('*'),supabase.from('documents').select('*,supplier:suppliers(name)'),supabase.from('document_items').select('*'),supabase.from('products').select('*')]);return{exported_at:new Date().toISOString(),suppliers:suppliers.data||[],documents:documents.data||[],document_items:items.data||[],products:products.data||[]} }
