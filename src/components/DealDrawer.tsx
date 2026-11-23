import { ArrowUpRight, Check, X } from 'lucide-react'
import type { ReosDeal } from '../store/reosStore'

const stages=['Sourced','Underwritten','Offer Sent','Under Contract','Diligence','Closing','Rehab','Stabilized / Sold']

export default function DealDrawer({deal,close,navigate}:{deal:ReosDeal;close:()=>void;navigate:(view:string)=>void}){
 const current=stages.indexOf(deal.stage)
 return <div className="drawer-layer"><aside className="deal-drawer"><div className="drawer-head"><div><small>DEAL COMMAND WORKSPACE</small><h2>{deal.name}</h2><span>{deal.address}, {deal.city} {deal.state}</span></div><button onClick={close}><X size={18}/></button></div><div className="lifecycle-stepper">{stages.map((stage,index)=><button key={stage} className={index<current?'done':index===current?'current':''}><i>{index<current?<Check size={11}/>:index+1}</i><span>{stage}</span></button>)}</div><div className="drawer-actions">{['Underwriting','Creative Finance','Outreach','Offers & Contracts','Capital','Due Diligence','Vendors & RFQs','Closing','Construction','Property Management'].map(view=><button key={view} onClick={()=>{navigate(view);close()}}><span>{view}</span><ArrowUpRight size={14}/></button>)}</div><div className="drawer-kpis"><div><small>Purchase</small><strong>${deal.purchasePrice.toLocaleString()}</strong></div><div><small>ARV</small><strong>${deal.arv.toLocaleString()}</strong></div><div><small>Projected ROI</small><strong>{deal.roi}%</strong></div></div></aside></div>
}
