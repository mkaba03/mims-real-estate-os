import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type PropertyType = 'SFH'|'2-4 Unit'|'5+ Multifamily'|'Commercial'|'Industrial'|'Land'|'Land Development'
export type LifecycleStage = 'Sourced'|'Underwritten'|'Offer Sent'|'Under Contract'|'Diligence'|'Closing'|'Rehab'|'Stabilized / Sold'

export interface ReosDeal {
  id:string
  name:string
  address:string
  city:string
  state:string
  zip:string
  type:PropertyType
  channel:string
  stage:LifecycleStage
  askingPrice:number
  purchasePrice:number
  arv:number
  rehab:number
  monthlyRent:number
  annualTaxes:number
  annualInsurance:number
  monthlyHoa:number
  annualDebtService:number
  units:number
  roi:number
  dscr:number
  coc:number
  image:string
  scores:{retail:number;wholesale:number;creative:number;auction:number}
}

export interface Approval {
  id:string
  kind:'Offer'|'Bid Award'|'Escrow Draw'|'Closing Wire'|'Contract'
  dealId:string
  title:string
  detail:string
  amount:number
  status:'Pending'|'Approved'|'Rejected'
}

interface ReosState {
  activeDealId:string
  deals:ReosDeal[]
  approvals:Approval[]
  setActiveDeal:(id:string)=>void
  addDeal:(deal:ReosDeal)=>void
  updateApproval:(id:string,status:'Approved'|'Rejected')=>void
  resetDemoData:()=>void
  getActiveDeal:()=>ReosDeal
}

export const initialDeals:ReosDeal[]=[
 {id:'oakwood',name:'Oakwood Multifamily',address:'1842 W Roscoe St',city:'Chicago',state:'IL',zip:'60657',type:'5+ Multifamily',channel:'Off-Market',stage:'Underwritten',askingPrice:785000,purchasePrice:785000,arv:1020000,rehab:86000,monthlyRent:7800,annualTaxes:18840,annualInsurance:7200,monthlyHoa:0,annualDebtService:72000,units:6,roi:18.4,dscr:1.32,coc:14.2,image:'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80',scores:{retail:88,wholesale:82,creative:91,auction:54}},
 {id:'kenmore',name:'North Kenmore House',address:'5427 N Kenmore Ave',city:'Chicago',state:'IL',zip:'60640',type:'SFH',channel:'MLS',stage:'Offer Sent',askingPrice:420000,purchasePrice:420000,arv:548000,rehab:48000,monthlyRent:3100,annualTaxes:10800,annualInsurance:4200,monthlyHoa:0,annualDebtService:31200,units:1,roi:15.7,dscr:1.18,coc:11.8,image:'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',scores:{retail:91,wholesale:76,creative:68,auction:42}},
 {id:'michigan',name:'Michigan Avenue Mixed-Use',address:'2916 S Michigan Ave',city:'Chicago',state:'IL',zip:'60616',type:'Commercial',channel:'Auction.com',stage:'Diligence',askingPrice:365000,purchasePrice:365000,arv:465000,rehab:62000,monthlyRent:4200,annualTaxes:14200,annualInsurance:5800,monthlyHoa:420,annualDebtService:28600,units:4,roi:12.9,dscr:1.41,coc:10.6,image:'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=80',scores:{retail:62,wholesale:86,creative:71,auction:94}},
 {id:'austin-land',name:'Austin Industrial Land',address:'Hwy 290',city:'Austin',state:'TX',zip:'78724',type:'Land',channel:'Tax Deed/Lien',stage:'Sourced',askingPrice:245000,purchasePrice:245000,arv:720000,rehab:90000,monthlyRent:0,annualTaxes:6200,annualInsurance:2600,monthlyHoa:0,annualDebtService:18000,units:0,roi:31.2,dscr:0,coc:38.2,image:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',scores:{retail:58,wholesale:73,creative:79,auction:88}},
 {id:'subject-to',name:'Subject-To Seller Carry Deal',address:'8811 S Hermitage Ave',city:'Chicago',state:'IL',zip:'60620',type:'2-4 Unit',channel:'Probate',stage:'Under Contract',askingPrice:310000,purchasePrice:310000,arv:490000,rehab:44000,monthlyRent:4680,annualTaxes:9600,annualInsurance:3900,monthlyHoa:0,annualDebtService:24000,units:3,roi:22.6,dscr:1.45,coc:18.9,image:'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80',scores:{retail:70,wholesale:84,creative:96,auction:61}},
]

export const initialApprovals:Approval[]=[
 {id:'approval-1',kind:'Offer',dealId:'oakwood',title:'Oakwood binding PSA',detail:'PSA · Investor approval + counsel review',amount:785000,status:'Pending'},
 {id:'approval-2',kind:'Bid Award',dealId:'kenmore',title:'Crown Roofing award',detail:'Roofing scope · license verified',amount:18900,status:'Pending'},
 {id:'approval-3',kind:'Escrow Draw',dealId:'michigan',title:'Finish millwork draw',detail:'Photos reviewed · 81% complete',amount:31000,status:'Pending'},
 {id:'approval-4',kind:'Closing Wire',dealId:'subject-to',title:'Closing wire verification',detail:'MFA + call-back required',amount:245000,status:'Pending'},
]

export const useReosStore=create<ReosState>()(persist((set,get)=>({
 activeDealId:'oakwood',deals:initialDeals,approvals:initialApprovals,
 setActiveDeal:(id)=>set({activeDealId:id}),
 addDeal:(deal)=>set(state=>({deals:[deal,...state.deals],activeDealId:deal.id})),
 updateApproval:(id,status)=>set(state=>({approvals:state.approvals.map(a=>a.id===id?{...a,status}:a)})),
 resetDemoData:()=>set({activeDealId:'oakwood',deals:initialDeals,approvals:initialApprovals}),
 getActiveDeal:()=>get().deals.find(deal=>deal.id===get().activeDealId)||get().deals[0],
}),{
 name:'reos_vite_state_v1',
 storage:createJSONStorage(()=>localStorage),
 partialize:(state)=>({activeDealId:state.activeDealId,deals:state.deals,approvals:state.approvals}),
}))
