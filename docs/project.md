# 🐟 Zalait Doc App - Project Documentation

## Overview
אפליקציית ווב (PWA) לניהול חשבוניות ותעודות משלוח עבור **דגים זלאיט** - עסק קמעונאי ומפעל דגים קפואים.
הבעלים: **צ'זי (Chezi)** - רמת פיתוח מתחילה, דורש הדרכה צעד-צעד עם קוד מוכן להעתקה.

## Live URLs
- **App:** https://zalait-doc-app.vercel.app
- **GitHub:** https://github.com/zalaitfish/zalait-doc-app
- **Supabase Dashboard:** https://supabase.com/dashboard/project/nymrpfuiwkldylvapxsy
- **OCR Edge Function:** https://supabase.com/dashboard/project/nymrpfuiwkldylvapxsy/functions/ocr
- **Anthropic Console:** https://console.anthropic.com

## Stack
| Layer | Technology | Details |
|-------|-----------|---------|
| Frontend | React 18 + Vite 5 + Tailwind 3 | PWA, RTL Hebrew, font: Heebo |
| Hosting | Vercel (Hobby/Free) | Auto-deploy from GitHub `main` branch |
| Database | Supabase PostgreSQL | Free tier, 500MB DB, 1GB Storage |
| File Storage | Supabase Storage | Bucket: `documents` (public) |
| OCR/AI | Claude Haiku 4.5 via Supabase Edge Function | Model: `claude-haiku-4-5` |
| Icons | lucide-react | |

## Supabase Credentials
- **Project Ref:** `nymrpfuiwkldylvapxsy`
- **URL:** `https://nymrpfuiwkldylvapxsy.supabase.co`
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55bXJwZnVpd2tsZHlsdmFweHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjMwMDksImV4cCI6MjA5MTQ5OTAwOX0.df_R2vEXNAMeYfxkJ9a2pi4FXgdttp7mgtgpGKTjnlg`
- **Region:** eu-central-2
- **Anthropic API Key:** Stored as Supabase Edge Function secret `ANTHROPIC_API_KEY` (NOT in code)

## Vercel Environment Variables
- `VITE_SUPABASE_URL` = `https://nymrpfuiwkldylvapxsy.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = (anon key above)

## Database Schema (Supabase PostgreSQL)
```
suppliers       → id(uuid), name, phone, email, payment_terms_days(default 30), notes, created_at
documents       → id(uuid), type(invoice|delivery|credit), supplier_id(FK), doc_number, doc_date, due_date, total, vat, status(pending|approved|paid|archived), payment_status(unpaid|partial|paid), file_url, ocr_text, ocr_raw(jsonb), tags(text[]), voice_note_url, linked_credit_for(FK→documents), created_at
document_items  → id(uuid), document_id(FK), product_code, barcode, name, qty, unit, cost_price, line_total
products        → id(uuid), code(unique), name, barcode, cost_price, sale_price, target_margin_pct(default 30), in_pos(bool), pos_id, category, last_supplier_id(FK), last_updated
price_history   → id(uuid), product_id(FK), cost_price, sale_price, source_document_id(FK), changed_at
alerts          → id(uuid), type(price_up|price_down|new_product|barcode_change|credit_pending|payment_due), product_id(FK), document_id(FK), message(JSON string), severity(info|warning|critical), status(open|dismissed|resolved), created_at
payments        → id(uuid), document_id(FK), amount, paid_at, method, reference, notes
```

## RLS Status
- All tables: **RLS DISABLED** (dev mode - no auth yet)
- Storage policies: public insert/read/update/delete on `documents` bucket

## File Structure (GitHub repo root = Vite project root)
```
├── index.html              # Entry HTML (RTL Hebrew)
├── package.json            # Dependencies
├── vite.config.js          # Vite + PWA config
├── tailwind.config.js
├── postcss.config.js
├── vercel.json             # Vercel routing config
├── .gitignore
├── .env.example
├── db/                     # SQL migrations (reference only, run in Supabase SQL Editor)
│   ├── 01_initial_schema.sql
│   └── 02_storage_delete_policy.sql
├── supabase/
│   └── functions/
│       └── ocr/
│           └── index.ts    # Edge Function - OCR via Claude Haiku (deployed separately in Supabase)
└── src/
    ├── main.jsx            # React entry
    ├── index.css           # Tailwind + brand CSS vars (--brand: #1e6fb8)
    ├── App.jsx             # Router + bottom nav (5 main + "more" menu)
    ├── api/
    │   ├── supabase.js     # Supabase client init
    │   ├── db.js           # All DB operations (CRUD for all tables)
    │   └── ocr.js          # Call Edge Function for OCR
    ├── lib/
    │   ├── imageCompress.js # Compress images to ~350KB before upload
    │   ├── backup.js       # Export JSON + download all files
    │   └── priceAnalyzer.js # Compare prices, create alerts, calc margins
    └── pages/
        ├── Dashboard.jsx    # Stats + recent docs + alerts banner
        ├── Upload.jsx       # 3 stages: capture → AI analyzing → review/confirm
        ├── Documents.jsx    # List + search + filter + delete + download per item
        ├── PriceAlerts.jsx  # Actionable alerts (approve/dismiss price changes, add new products)
        ├── Products.jsx     # Product catalog with margins, edit, add
        ├── Suppliers.jsx    # Supplier list + add form (exports: Modal, Field, ErrorBox, EmptyState)
        ├── Credits.jsx      # [skeleton] Credit note tracking
        ├── Payments.jsx     # [skeleton] Payment tracking
        ├── MonthlyReport.jsx # [skeleton] Monthly supplier report
        ├── Archive.jsx      # [skeleton] Full-text search archive
        └── Settings.jsx     # Backup (JSON + files), delete all, connections placeholder
```

## OCR Flow
1. User captures/uploads image
2. Image compressed to ~350KB (imageCompress.js)
3. Uploaded to Supabase Storage → gets public URL
4. Frontend calls Edge Function `ocr` with { imageUrl, suppliers[] }
5. Edge Function fetches image, converts to base64, sends to Claude Haiku 4.5
6. Claude returns JSON: { doc_type, supplier_name, supplier_id, doc_number, doc_date, total, vat, items[] }
7. Frontend pre-fills form with OCR results
8. User reviews/corrects → saves document
9. After save: document_items saved + priceAnalyzer runs (creates alerts for price changes / new products)

## Price Analysis Flow
- On document save, each OCR item is matched to existing products (by barcode → code → name)
- If match found + price changed → creates price_up/price_down alert
- If match found + barcode changed → creates barcode_change alert
- If no match → creates new_product alert with suggested sale price (cost × 1.3)
- User acts on alerts in PriceAlerts page (approve/dismiss)

## Navigation Structure
- Bottom nav: 5 main icons (Dashboard, Scan, Alerts, Documents, More)
- "More" opens overlay menu with: Credits, Payments, Monthly Report, Products, Suppliers, Archive, Settings

## Deployment Workflow
1. Update files in GitHub (edit via browser or upload)
2. Vercel auto-detects commit and rebuilds (~1-2 min)
3. Edge Functions updated separately in Supabase Dashboard → Code → Deploy

## POS Integration (Planned, not implemented)
- Kaspit/Sunmi POS at store: `10.0.0.138:8080`
- Every product action (price update, barcode change, add to catalog, delete) MUST sync with POS
- DB-only update is NEVER sufficient - POS must always be updated in tandem
- Only works when user is on store Wi-Fi network
- API documentation not yet obtained from Kaspit

## Working Conventions (for Chezi)
- Chezi has beginner dev knowledge - provide full copy-paste code
- Chezi prefers: full file replacements, confirms saves with "שמרתי"
- File updates to GitHub: edit via browser (pencil icon) or delete repo + recreate + drag files
- No CLI/CMD usage preferred - everything through browser when possible
- Hebrew UI, RTL throughout
