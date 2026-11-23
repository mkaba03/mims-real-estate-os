import { ChevronDown } from 'lucide-react'
import { useReosStore } from '../store/reosStore'

export default function GlobalDealSelector(){
 const deals=useReosStore(state=>state.deals)
 const activeDealId=useReosStore(state=>state.activeDealId)
 const setActiveDeal=useReosStore(state=>state.setActiveDeal)
 return <label className="deal-selector"><span>ACTIVE DEAL</span><select value={activeDealId} onChange={event=>setActiveDeal(event.target.value)}>{deals.map(deal=><option value={deal.id} key={deal.id}>{deal.name}</option>)}</select><ChevronDown size={13}/></label>
}
