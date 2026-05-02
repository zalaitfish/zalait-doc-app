import { PageHeader, EmptyState } from './Suppliers'
export default function Payments() {
  return (<div><PageHeader title="תשלומים" subtitle="מעקב תשלומים לספקים" /><div className="px-5"><EmptyState text="יושלם בקרוב" /></div></div>)
}
