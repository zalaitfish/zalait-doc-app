import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  Home, Camera, Bell, FileText, Fish,
  Handshake, Wallet, BarChart3, Archive as ArchiveIcon, Settings as SettingsIcon,
  Undo2, MoreHorizontal, X
} from 'lucide-react'

import Dashboard from './pages/Dashboard.jsx'
import Documents from './pages/Documents.jsx'
import Upload from './pages/Upload.jsx'
import Suppliers from './pages/Suppliers.jsx'
import Products from './pages/Products.jsx'
import PriceAlerts from './pages/PriceAlerts.jsx'
import Credits from './pages/Credits.jsx'
import Payments from './pages/Payments.jsx'
import MonthlyReport from './pages/MonthlyReport.jsx'
import Archive from './pages/Archive.jsx'
import Settings from './pages/Settings.jsx'

const mainNav = [
  { to: '/',        label: 'ראשי',    Icon: Home },
  { to: '/upload',  label: 'סריקה',   Icon: Camera },
  { to: '/alerts',  label: 'התראות', Icon: Bell },
  { to: '/documents',label: 'מסמכים', Icon: FileText },
]

const moreNav = [
  { to: '/credits',  label: 'זיכויים', Icon: Undo2 },
  { to: '/payments', label: 'תשלומים', Icon: Wallet },
  { to: '/monthly',  label: 'דוח חודשי', Icon: BarChart3 },
  { to: '/products', label: 'פריטים',  Icon: Fish },
  { to: '/suppliers',label: 'ספקים',   Icon: Handshake },
  { to: '/archive',  label: 'ארכיון',  Icon: ArchiveIcon },
  { to: '/settings', label: 'הגדרות',  Icon: SettingsIcon }
]

export default function App() {
  const [showMore, setShowMore] = useState(false)

  return (
    <div className="min-h-full flex flex-col">
      <main className="flex-1 pb-24">
        <div className="page-enter">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/alerts" element={<PriceAlerts />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/monthly" element={<MonthlyReport />} />
            <Route path="/products" element={<Products />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white z-20" style={{boxShadow:'0 -1px 12px rgba(0,0,0,0.06)'}}>
        <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-1">
          {mainNav.map(({ to, label, Icon }) => (
            <NavLink
              key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-2xl transition-all ${
                  isActive ? 'text-[var(--brand)] bg-[var(--brand-50)]' : 'text-gray-400'
                }`
              }
            >
              <Icon className="w-6 h-6" strokeWidth={2} />
              <span className="text-[10px] font-semibold leading-none">{label}</span>
            </NavLink>
          ))}
          <button onClick={() => setShowMore(true)}
            className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-2xl text-gray-400">
            <MoreHorizontal className="w-6 h-6" strokeWidth={2} />
            <span className="text-[10px] font-semibold leading-none">עוד</span>
          </button>
        </div>
      </nav>

      {showMore && (
        <div className="fixed inset-0 bg-black/30 z-30 flex items-end" onClick={() => setShowMore(false)}>
          <div className="bg-white w-full rounded-t-3xl pt-3 pb-10 px-5" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="grid grid-cols-4 gap-4">
              {moreNav.map(({ to, label, Icon }) => (
                <NavLink key={to} to={to} onClick={() => setShowMore(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all ${
                      isActive ? 'bg-[var(--brand-light)] text-[var(--brand)]' : 'text-gray-600'
                    }`
                  }>
                  <Icon className="w-6 h-6" />
                  <span className="text-[11px] font-semibold">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
