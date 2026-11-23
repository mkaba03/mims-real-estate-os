import { useState } from 'react'
import { CirclePlus, Search, Upload, X } from 'lucide-react'
import { useReosStore, type ReosDeal } from '../store/reosStore'

export default function ImportModal({close}:{close:()=>void}){
 const [tab,setTab]=useState<'Address'|'CSV'|'Docket'>('Address')
 const addDeal=useReosStore(state=>state.addDeal)
 const [address,setAddress]=useState('')
 const [propertyType,setPropertyType]=useState<ReosDeal['type']>('SFH')

 function createDeal(){
  const deal:ReosDeal={id:`import-${Date.now()}`,name:address||'Imported Opportunity',address:address||'Address pending',city:'Chicago',state:'IL',zip:'60601',type:propertyType,channel:'Manual Import',stage:'Sourced',askingPrice:425000,purchasePrice:425000,arv:575000,rehab:52000,monthlyRent:3200,annualTaxes:11000,annualInsurance:4300,monthlyHoa:0,annualDebtService:30000,units:propertyType==='SFH'?1:4,roi:16.8,dscr:1.21,coc:12.4,image:'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80',scores:{retail:78,wholesale:82,creative:74,auction:55}}
  addDeal(deal);close()
 }

 return <div className="modal-layer"><div className="import-modal"><div className="modal-top"><div><small>IMPORT OPPORTUNITY</small><h2>Add Property / Import Deals</h2></div><button onClick={close}><X size={18}/></button></div><div className="import-tabs">{(['Address','CSV','Docket'] as const).map(t=><button className={tab===t?'on':''} onClick={()=>setTab(t)} key={t}>{t==='Address'?'Address / MLS':t==='CSV'?'Bulk CSV':'Auction / Tax / Probate'}</button>)}</div>{tab==='Address'&&<div className="import-form"><label>Property address or MLS URL<input value={address} onChange={event=>setAddress(event.target.value)} placeholder="1234 Main Street or https://..."/></label><label>Property type<select value={propertyType} onChange={event=>setPropertyType(event.target.value as ReosDeal['type'])}><option>SFH</option><option>2-4 Unit</option><option>5+ Multifamily</option><option>Commercial</option><option>Industrial</option><option>Land</option><option>Land Development</option></select></label><button className="import-submit" onClick={createDeal}><Search size={15}/> Import Property</button></div>}{tab==='CSV'&&<div className="upload-import"><Upload size={28}/><strong>Drop CSV or XLS file here</strong><small>Address, APN, FIPS, state, asking price</small><button><CirclePlus size={14}/> Choose File</button></div>}{tab==='Docket'&&<div className="import-form"><label>Source<select><option>Tax Deed / Lien</option><option>Probate Docket</option><option>Auction.com</option><option>HUD Home Store</option><option>Land Bank</option></select></label><label>County / Jurisdiction<input placeholder="Cook County, IL"/></label><label>Docket or parcel URL<input placeholder="https://..."/></label><button className="import-submit" onClick={createDeal}>Create Import</button></div>}</div></div>
}
