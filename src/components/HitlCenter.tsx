import { Check, X } from 'lucide-react'
import { useReosStore } from '../store/reosStore'

export default function HitlCenter({close}:{close:()=>void}){
 const approvals=useReosStore(state=>state.approvals)
 const updateApproval=useReosStore(state=>state.updateApproval)
 return <div className="notification-center"><div className="notification-head"><strong>HITL Approvals</strong><button onClick={close}><X size={15}/></button></div>{approvals.filter(item=>item.status==='Pending').map(item=><div className="approval-item" key={item.id}><div><strong>{item.title}</strong><span>{item.kind}</span><small>{item.detail} · ${item.amount.toLocaleString()}</small></div><div><button className="approve" onClick={()=>updateApproval(item.id,'Approved')}><Check size={13}/>Approve</button><button className="reject" onClick={()=>updateApproval(item.id,'Rejected')}><X size={13}/></button></div></div>)}</div>
}
