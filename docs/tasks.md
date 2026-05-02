# 📋 Zalait Doc App - Tasks & Roadmap

## ✅ Completed

### Infrastructure
- [x] React + Vite + Tailwind project setup (PWA, RTL, Hebrew font Heebo)
- [x] Supabase project created (DB + Storage + Auth framework)
- [x] Full database schema (7 tables + indexes + FTS)
- [x] GitHub repo: `zalaitfish/zalait-doc-app`
- [x] Vercel deployment with auto-deploy from GitHub
- [x] Environment variables configured in Vercel
- [x] RLS disabled for dev mode
- [x] Storage bucket `documents` with public CRUD policies

### Frontend Pages (Working)
- [x] **Dashboard** - Stats cards (docs/credits/suppliers), alerts banner, recent docs, scan CTA
- [x] **Upload/Scan** - 3-stage flow: capture → AI analyzing → review/confirm. Image compression, file upload to Storage, OCR via Edge Function, auto-fill form, save document + items + price analysis
- [x] **Documents** - List with search + filter by type, delete per item, download per item, view file link
- [x] **Suppliers** - List + add form (Modal). Exports shared components: Modal, Field, ErrorBox, EmptyState
- [x] **Products** - Full catalog: list, search, add, edit, delete. Shows cost/sale/margin%. "Calculate sale price" button
- [x] **PriceAlerts** - Actionable alerts: price up/down (approve + update / cost only / dismiss), new product (add to catalog), barcode change (update)
- [x] **Settings** - Backup JSON export, download all files, delete all documents (with "מחק" confirmation)

### Frontend Pages (Skeleton only)
- [ ] **Credits** - placeholder text
- [ ] **Payments** - placeholder text
- [ ] **MonthlyReport** - placeholder text
- [ ] **Archive** - placeholder text

### OCR / AI
- [x] Supabase Edge Function `ocr` deployed
- [x] Claude Haiku 4.5 integration (`claude-haiku-4-5`)
- [x] Anthropic API key stored as Supabase secret
- [x] Image → base64 → Claude → JSON parsing
- [x] CORS headers configured
- [x] Error logging with console.error
- [ ] **FIX NEEDED:** Update prompt to emphasize fish/seafood context (currently may misidentify items like "לברק" as "ג'קט")

### Features
- [x] Image compression before upload (~350KB target)
- [x] Price analysis after scan (match products, detect changes, create alerts)
- [x] Margin calculation (cost → sale price with target %)
- [x] Single document delete (DB + Storage)
- [x] Single document download
- [x] Bulk data export (JSON)
- [x] Bulk file download
- [x] Delete all documents (with safety confirmation)

### UI/UX
- [x] Bottom nav redesigned: 5 big icons + "More" overlay menu
- [x] Brand colors: white + blue (#1e6fb8) minimalist
- [x] Page transitions (fadeIn animation)
- [x] RTL throughout
- [x] Mobile-first responsive design

---

## 🔧 In Progress / Fix Needed

### OCR Prompt Improvement
- **Problem:** AI misidentifies fish items (e.g., "לברק" → "ג'קט")
- **Solution:** Update prompt in Supabase Edge Function to add fish/seafood context
- **Status:** New prompt provided to Chezi, needs to be deployed in Supabase → Edge Functions → ocr → Code → Deploy

---

## 📋 Planned (Priority Order)

### 🔴 High Priority

#### 1. Credit Note Tracking (תעודות זיכוי)
- When uploading invoice: option to mark items/lines as "waiting for credit note" (ממתין לזיכוי)
- When uploading credit note: auto-match to original invoice (by supplier + items + amount)
- When matched: mark both as "handled" (טופל ✅)
- Credits page: list pending credits, days waiting, status
- Dashboard: show pending credits count

#### 2. Monthly Supplier Report (דוח סוף חודש)
- Select month + supplier (or all suppliers)
- Calculate: total invoices − total credit notes = amount due
- Show breakdown by document
- Export to PDF/Excel for accountant
- Summary across all suppliers

#### 3. Payment Tracking (מעקב תשלומים)
- Due dates based on supplier payment terms (שוטף + X)
- Payment status per document (unpaid / partial / paid)
- Record payments (amount, date, method, reference)
- Alerts for upcoming due dates
- Dashboard integration

### 🟡 Medium Priority

#### 4. Kaspit POS Integration (חיבור לקופה)
- **Critical rule:** Every product action MUST sync with POS at `10.0.0.138:8080`
- Obtain Kaspit API documentation
- Test connectivity from browser (CORS check)
- Implement: add product to POS, update price, update barcode, delete
- PriceAlerts: "approve" should update both DB and POS
- Products: edit should sync to POS
- Only works on store Wi-Fi
- Fallback UI if POS unreachable

#### 5. Full-Text Archive Search (חיפוש חופשי)
- Search across all OCR text stored in documents.ocr_text
- Filter by date range, supplier, document type, tags
- Highlight matching text in results
- Use PostgreSQL FTS index already created

#### 6. Price History Charts
- Per-product cost price over time graph
- Show when prices changed and by how much
- Supplier comparison for same product

#### 7. OCR Improvements
- Test with real invoices from Chezi's suppliers
- Fine-tune prompt per supplier format if needed
- Add common fish product names to prompt
- Handle handwritten notes
- Handle multi-page documents

### 🟢 Nice to Have

#### 8. Google Drive Auto-Backup
- OAuth2 connection to Google Drive
- Auto-upload scanned documents
- Organized by year/month/supplier folders

#### 9. Multi-User & Permissions
- Supabase Auth (email/password or phone OTP)
- Roles: owner (full access), manager (no delete), user (scan only)
- Re-enable RLS with proper policies
- Activity log

#### 10. Voice Notes
- Record audio note on any document
- Upload to Supabase Storage
- Play back from document view

#### 11. Export for Accountant
- End-of-month package: all invoices + credit notes + summary
- PDF report with totals
- Excel spreadsheet with line items

#### 12. Custom Domain
- Replace `zalait-doc-app.vercel.app` with custom domain (e.g., `docs.zalait.co.il`)

#### 13. Tagging System
- Auto-tag documents by category (fish, packaging, cleaning, electricity)
- Manual tags
- Filter by tags in archive

#### 14. Smart Notifications
- Credit notes pending > 30 days
- Payments due in 3 days
- Unusual price increase > 20%
- Push notifications via PWA

---

## 🐛 Known Issues

1. **OCR fish misidentification** - prompt needs fish context (fix provided, pending deploy)
2. **Credit notes page** - skeleton only, not functional
3. **Payments page** - skeleton only, not functional
4. **Monthly report page** - skeleton only, not functional
5. **Archive page** - skeleton only, not functional
6. **POS not connected** - Kaspit API docs needed
7. **No authentication** - anyone with the URL can access (RLS disabled)
8. **No offline mode** - PWA registered but no offline caching strategy

---

## 📝 Chezi's Feedback Log

### April 12, 2026
1. ✅ Bottom nav too small, icons too many → Fixed: 5 big icons + "More" menu
2. 📋 Credit notes: need "waiting for credit" marking + auto-match when credit uploaded → Planned (#1)
3. ✅ OCR writing "jacket" instead of "lavrak" → Prompt fix provided (pending deploy)
4. ✅ Asked for full feature roadmap → This document

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| v1 | Apr 11 | Initial skeleton - all pages, routing, RTL |
| v2 | Apr 11 | Supabase integration, real DB, upload flow |
| v3 | Apr 11 | Image compression, delete, backup, settings |
| v4 | Apr 12 | OCR with Claude Haiku, auto-fill forms, price analysis |
| v5 | Apr 12 | Product catalog, price alerts with actions, dashboard stats |
| v5.1 | Apr 27 | Nav redesign (5 icons + More), OCR prompt fix (pending) |


test