import { supabase } from './supabase'
export async function extractDocData(imageUrl, suppliers = []) {
  const { data, error } = await supabase.functions.invoke('ocr', {
    body: { imageUrl, suppliers: suppliers.map(s => ({ id: s.id, name: s.name })) }
  })
  if (error) throw new Error(error.message || 'OCR failed')
  if (data?.error) throw new Error(data.error)
  return data
}
