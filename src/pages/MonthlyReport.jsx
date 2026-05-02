import { PageHeader, EmptyState } from './Suppliers'
export default function MonthlyReport() {
  return (<div><PageHeader title="דוח חודשי" subtitle="סיכום סוף חודש לכל ספק" /><div className="px-5"><EmptyState text="יושלם בקרוב" /></div></div>)
}
