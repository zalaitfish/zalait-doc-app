export async function compressImage(file, maxKB=350, maxDim=1800) {
  if(!file.type.startsWith('image/')) return file
  const img=await loadImage(file); const{width,height}=scaleDown(img.width,img.height,maxDim)
  const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height; canvas.getContext('2d').drawImage(img,0,0,width,height)
  let quality=0.85; let blob=await toBlob(canvas,quality)
  while(blob.size>maxKB*1024&&quality>0.3){quality-=0.1;blob=await toBlob(canvas,quality)}
  return new File([blob],file.name.replace(/\.\w+$/,'.jpg'),{type:'image/jpeg'})
}
const loadImage=f=>new Promise((res,rej)=>{const img=new Image();img.onload=()=>res(img);img.onerror=rej;img.src=URL.createObjectURL(f)})
const scaleDown=(w,h,max)=>{if(w<=max&&h<=max)return{width:w,height:h};const r=w>h?max/w:max/h;return{width:Math.round(w*r),height:Math.round(h*r)}}
const toBlob=(canvas,q)=>new Promise(res=>canvas.toBlob(res,'image/jpeg',q))
