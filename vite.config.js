import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({plugins:[react(),VitePWA({registerType:'autoUpdate',manifest:{name:'Zalait Doc',short_name:'ZalaitDoc',description:'ניהול חשבוניות - דגים זלאיט',theme_color:'#0066FF',background_color:'#F7F8FA',display:'standalone',orientation:'portrait',lang:'he',dir:'rtl',icons:[{src:'icon-192.png',sizes:'192x192',type:'image/png'},{src:'icon-512.png',sizes:'512x512',type:'image/png'}]}})],server:{port:5173,host:true}})
