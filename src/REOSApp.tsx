import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, BarChart3, Bell, Bot, Building2, ChevronDown, CircleHelp, CirclePlus, Clock3, Command, FileCheck2, Filter, Heart, Landmark, LayoutGrid, Menu, MoreHorizontal, Network, Search, Settings, ShieldCheck, Sparkles, TrendingUp, Upload, Users, Wrench, X } from 'lucide-react'
import './REOSApp.css'

const properties = [
  {id:1,name:'Oakwood Multifamily',address:'1842 W Roscoe St, Chicago, IL',type:'Multifamily',bed:'3 units',price:785000,arv:1020000,roi:18.4,status:'High potential',image:'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=82'},
  {id:2,name:'North Kenmore House',address:'5427 N Kenmore Ave, Chicago, IL',type:'Single family',bed:'4 bed · 2 bath',price:420000,arv:548000,roi:15.7,status:'New listing',image:'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=82'},
  {id:3,name:'Michigan Avenue Loft',address:'2916 S Michigan Ave, Chicago, IL',type:'Condo',bed:'2 bed · 2 bath',price:365000,arv:465000,roi:12.9,status:'Needs review',image:'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=82'},
]

const nav = [
  {label:'Overview',icon:LayoutGrid},
  {label:'Deal explorer',icon:Search},
  {label:'Underwriting',icon:BarChart3},
  {label:'Creative finance',icon:Landmark},
  {label:'Outreach',icon:Users},
  {label:'Offers & contracts',icon:FileCheck2},
  {label:'Capital',icon:Landmark},
  {label:'Due diligence',icon:ShieldCheck},
  {label:'Vendors & RFQs',icon:Wrench},
  {label:'Closing',icon:FileCheck2},
  {label:'Construction',icon:Building2},
  {label:'Property management',icon:Building2},
  {label:'Reports',icon:TrendingUp},
]

const platformNav = [
  {label:'AI agents',icon:Bot},
  {label:'Integrations',icon:Network},
  {label:'Documents',icon:Upload},
]

export default function REOSApp(){
  const [active,setActive]=useState('Overview')
  const [search,setSearch]=useState('')
  const [type,setType]=useState('All')
  const [saved,setSaved]=useState<number[]>([])
  const [modal,setModal]=useState<'property'|'filter'|'help'|null>(null)
  const [notifications,setNotifications]=useState(false)
  const [menu,setMenu]=useState(false)

  const visible=useMemo(()=>properties.filter(p=>
    (type==='All'||p.type===type)&&(`${p.name} ${p.address}`.toLowerCase().includes(search.toLowerCase()))
  ),[search,type])

  return <div className="reos-shell">
    <aside className={menu?'reos-sidebar open':'reos-sidebar'}>
      <div className="sidebar-top">
        <div className="reos-brand"><div className="brand-symbol"><Building2 size={20}/></div><span>REOS</span></div>
        <nav className="reos-nav">
          <p className="nav-label">WORKSPACE</p>
          {nav.map(({label,icon:Icon})=><button key={label} className={active===label?'nav-link active':'nav-link'} onClick={()=>{setActive(label);setMenu(false)}}><Icon size={18}/><span>{label}</span>{label==='Pipeline'&&<b>12</b>}</button>)}
          <p className="nav-label platform-label">PLATFORM</p>
          {platformNav.map(({label,icon:Icon})=><button key={label} className={active===label?'nav-link active':'nav-link'} onClick={()=>{setActive(label);setMenu(false)}}><Icon size={18}/><span>{label}</span></button>)}
        </nav>
      </div>
      <div className="sidebar-bottom">
        <button className="nav-link"><Users size={18}/><span>Team</span></button>
        <button className="nav-link" onClick={()=>setModal('help')}><Settings size={18}/><span>Settings</span></button>
        <div className="profile-chip"><div className="profile-avatar">MK</div><div><strong>Michael Kaba</strong><span>Investor account</span></div><ChevronDown size={16}/></div>
      </div>
    </aside>

    <main className="reos-main">
      <header className="reos-header">
        <div className="header-left">
          <button className="mobile-menu" onClick={()=>setMenu(v=>!v)}><Menu size={20}/></button>
          <div><p>MONDAY, NOVEMBER 23</p><h1>{active==='Overview'?'Good morning, Michael':active}</h1></div>
        </div>
        <div className="header-actions">
          <button className="header-icon" onClick={()=>setModal('help')}><CircleHelp size={19}/></button>
          <div className="notification-anchor">
            <button className="header-icon" onClick={()=>setNotifications(v=>!v)}><Bell size={19}/><i/></button>
            {notifications&&<div className="notification-popover"><div><strong>Notifications</strong><button onClick={()=>setNotifications(false)}><X size={15}/></button></div><p><span/>3 deals need review</p><p><span/>New lender term sheet received</p></div>}
          </div>
          <button className="primary-action" onClick={()=>setModal('property')}><CirclePlus size={17}/> Add property</button>
        </div>
      </header>

      {active==='Overview'?<Overview visible={visible} saved={saved} setSaved={setSaved} setModal={setModal} setActive={setActive}/>:<WorkspaceView active={active} search={search} setSearch={setSearch} />}
    </main>

    {modal&&<div className="modal-layer" onMouseDown={()=>setModal(null)}>
      <div className="modal-card" onMouseDown={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={()=>setModal(null)}><X size={18}/></button>
        {modal==='property'&&<PropertyForm onClose={()=>setModal(null)}/>} 
        {modal==='filter'&&<><h2>Filter opportunities</h2><p>Refine properties by strategy and market.</p><label>Property type<select value={type} onChange={e=>setType(e.target.value)}><option>All</option><option>Single family</option><option>Multifamily</option><option>Condo</option></select></label><button className="submit-button" onClick={()=>setModal(null)}>Apply filters</button></>}
        {modal==='help'&&<><div className="help-icon"><Sparkles size={22}/></div><h2>REOS workspace</h2><p>Use this workspace to source opportunities, underwrite assets, manage capital, and coordinate transactions.</p><button className="submit-button" onClick={()=>setModal(null)}>Got it</button></>}
      </div>
    </div>}
  </div>
}

function Overview({visible,saved,setSaved,setModal,setActive}:{visible:any[];saved:number[];setSaved:(v:any)=>void;setModal:(v:any)=>void;setActive:(v:string)=>void}){
  const [period,setPeriod]=useState('30D')
  return <>
    <section className="kpi-grid">
      <Kpi label="Portfolio value" value="$4.82M" change="8.2%" positive icon={Landmark}/>
      <Kpi label="Net operating income" value="$318.4K" change="12.5%" positive icon={TrendingUp}/>
      <Kpi label="Average cash-on-cash" value="14.8%" change="1.3%" negative icon={BarChart3}/>
      <Kpi label="Active deals" value="12" change="3 closing" icon={Clock3}/>
    </section>

    <section className="insight-grid">
      <article className="panel chart-panel">
        <div className="panel-heading"><div><p>PERFORMANCE</p><h2>Portfolio growth</h2></div><div className="period-control">{['7D','30D','3M','1Y'].map(p=><button key={p} className={period===p?'on':''} onClick={()=>setPeriod(p)}>{p}</button>)}</div></div>
        <div className="chart-summary"><strong>{period==='7D'?'$6,140':period==='30D'?'$24,580':period==='3M'?'$71,920':'$318,400'}</strong><span><ArrowUpRight size={13}/>12.4%</span></div>
        <div className="chart-area"><div className="chart-lines"><i/><i/><i/><i/></div><svg viewBox="0 0 760 200" preserveAspectRatio="none"><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#13a083" stopOpacity=".18"/><stop offset="1" stopColor="#13a083" stopOpacity="0"/></linearGradient></defs><path d="M0 164 C55 150 88 158 132 138 C180 116 218 132 260 112 C310 88 350 104 398 76 C448 48 498 82 548 58 C604 30 650 48 760 18 L760 200 L0 200Z" fill="url(#fill)"/><path d="M0 164 C55 150 88 158 132 138 C180 116 218 132 260 112 C310 88 350 104 398 76 C448 48 498 82 548 58 C604 30 650 48 760 18" fill="none" stroke="#11856f" strokeWidth="3"/><circle cx="398" cy="76" r="5" fill="#fff" stroke="#11856f" strokeWidth="3"/></svg></div>
        <div className="chart-axis"><span>Nov 1</span><span>Nov 5</span><span>Nov 10</span><span>Nov 15</span><span>Nov 20</span><span>Nov 23</span></div>
      </article>

      <article className="panel pipeline-panel">
        <div className="panel-heading"><div><p>LIVE PIPELINE</p><h2>Deal status</h2></div><button className="icon-more"><MoreHorizontal size={18}/></button></div>
        <div className="pipeline-ring"><div><strong>12</strong><span>active deals</span></div></div>
        <div className="pipeline-legend">{[['Sourcing',5,'#c0d8ff'],['Underwritten',3,'#79cfb8'],['Under contract',2,'#f3c66c'],['Closing',2,'#baa2e9']].map(([name,count,color])=><div key={name as string}><i style={{background:color as string}}/><span>{name}</span><strong>{count}</strong></div>)}</div>
      </article>
    </section>

    <section className="properties-section">
      <div className="section-heading"><div><p>MARKETPLACE</p><h2>Recommended opportunities</h2></div><div><button className="secondary-action" onClick={()=>setModal('filter')}><Filter size={16}/> Filter</button><button className="link-action" onClick={()=>setActive('Deal explorer')}>View all <ArrowUpRight size={15}/></button></div></div>
      <div className="property-grid">{visible.map(property=><article className="property-card" key={property.id}><div className="property-photo" style={{backgroundImage:`url(${property.image})`}}><span>{property.status}</span><button onClick={()=>setSaved(saved.includes(property.id)?saved.filter(id=>id!==property.id):[...saved,property.id])} className={saved.includes(property.id)?'heart saved':'heart'}><Heart size={17} fill={saved.includes(property.id)?'currentColor':'none'}/></button></div><div className="property-info"><p>{property.type} · {property.bed}</p><h3>{property.name}</h3><span className="property-address">{property.address}</span><div className="property-metrics"><div><span>Price</span><strong>${property.price.toLocaleString()}</strong></div><div><span>Est. ARV</span><strong>${property.arv.toLocaleString()}</strong></div><div><span>ROI</span><strong className="positive-value"><ArrowUpRight size={12}/>{property.roi}%</strong></div></div></div></article>)}</div>
    </section>
  </>
}

function Kpi({label,value,change,positive,negative,icon:Icon}:{label:string;value:string;change:string;positive?:boolean;negative?:boolean;icon:any}){return <article className="kpi-card"><div className="kpi-icon"><Icon size={18}/></div><div><p>{label}</p><strong>{value}</strong><span className={positive?'kpi-up':negative?'kpi-down':'kpi-neutral'}>{positive?<ArrowUpRight size={12}/>:negative?<ArrowDownRight size={12}/>:<Clock3 size={12}/>} {change}{positive?' this month':''}</span></div></article>}

function WorkspaceView({active,search,setSearch}:{active:string;search:string;setSearch:(v:string)=>void}){
  const descriptions:Record<string,string>= {
    'Deal explorer':'Search MLS, public records, auctions, probate, tax deeds, and distressed opportunities.',
    'Underwriting':'Run deterministic financial models across residential, commercial, land, and multifamily assets.',
    'Creative finance':'Model subject-to, seller carryback, wrap, novation, and lease-option structures.',
    'Outreach':'Manage voice, SMS, email, direct mail, consent, DNC, and seller follow-up workflows.',
    'Offers & contracts':'Review offers, execute HITL approval, generate state-specific contracts, and track e-sign.',
    'Capital':'Match institutional and private capital and generate lender underwriting binders.',
    'Due diligence':'Coordinate inspections, appraisals, surveys, environmental reviews, and contingency deadlines.',
    'Vendors & RFQs':'Manage vendors, broadcast RFQs, normalize bids, award scope, and create draw schedules.',
    'Closing':'Coordinate title, settlement audits, insurance, RON, wire verification, and closing.',
    'Construction':'Track rehabilitation milestones, geotagged photos, escrow draws, and approved spend.',
    'Property management':'Manage leases, screening, ACH rent, maintenance, utilities, and Schedule E accounting.',
    'Reports':'Review portfolio valuation, NOI, DSCR, pipeline bottlenecks, margins, and tax exports.',
    'AI agents':'Configure autonomous agents, provider models, approval boundaries, and execution policies.',
    'Integrations':'Connect MLS, parcel, voice, messaging, e-sign, banking, screening, storage, and automation vendors.',
    'Documents':'Review OCR, title, leases, T12s, contracts, settlement statements, and source citations.',
  }
  const stageCards:Record<string,string[]>={
    'Deal explorer':['New opportunities','Saved searches','Auction watch','Skip-traced owners'],
    'Underwriting':['Active scenarios','Draft analyses','Strategy ranking','Vision rehab'],
    'Creative finance':['Subject-To','Seller carryback','Novation','Lease option'],
    'Outreach':['Contact queues','Voice campaigns','SMS threads','Mail sequences'],
    'Offers & contracts':['Pending approval','Draft envelopes','Signed contracts','Contingencies'],
    'Capital':['Lender matches','Term sheets','Binders','Submissions'],
    'Due diligence':['Inspection','Appraisal','Survey','Environmental'],
    'Vendors & RFQs':['Approved vendors','Open RFQs','Bid comparisons','Awarded scope'],
    'Closing':['Title audit','Settlement audit','RON','Wire verification'],
    'Construction':['Milestones','Draw requests','Field photos','Budget variance'],
    'Property management':['Active leases','Delinquencies','Maintenance','Ledger entries'],
    'Reports':['Portfolio NOI','Deal pipeline','Vendor savings','Tax export'],
    'AI agents':['Sourcing agent','Underwriting agent','Outreach agent','Closing agent'],
    'Integrations':['Data providers','Communications','Financial','Document & e-sign'],
    'Documents':['Title commitments','T12 & rent rolls','Contracts','Settlement statements'],
  }
  const cards=stageCards[active]||['Sourcing','Underwriting','Outreach','Diligence','Closing','Operations']

  return <section className="workspace-view">
    <div className="workspace-banner"><div><p>REOS {active.toUpperCase()}</p><h2>{descriptions[active] ? active : `Manage ${active.toLowerCase()}`}</h2><span>{descriptions[active]||'Real-time operational context across your portfolio.'}</span></div><button className="banner-button"><CirclePlus size={16}/> New record</button></div>
    {['Deal explorer','Underwriting','Documents','Integrations','AI agents'].includes(active)&&<div className="workspace-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${active.toLowerCase()}...`}/><button><Command size={14}/>K</button></div>}
    <div className="workspace-grid">{cards.map((stage,i)=><article key={stage}><div className="workspace-card-top"><span>{i+1}</span><MoreHorizontal size={17}/></div><p>{stage}</p><strong>{[8,5,4,3,2,6][i%6]}</strong><small>active records</small><button className="card-open">Open module <ArrowUpRight size={13}/></button></article>)}</div>
    {active==='AI agents'&&<div className="agent-config-panel"><div><Bot size={21}/><span><strong>Agent execution policy</strong><small>Human approval required for financial commitments</small></span></div><button className="secondary-action"><ShieldCheck size={15}/> Configure policies</button></div>}
    {active==='Integrations'&&<div className="integration-panel">{['RealEstateAPI','Bridge RESO','Twilio','Vapi','DocuSign','Plaid','Stripe','Anthropic'].map((name,i)=><article key={name}><div className="integration-logo">{name.slice(0,1)}</div><div><strong>{name}</strong><span>{i<4?'Sandbox configured':'Not connected'}</span></div><button>{i<4?'Configure':'Connect'}</button></article>)}</div>}
    {active==='Outreach'&&<div className="workflow-panel"><div className="workflow-head"><div><p>OUTBOUND AUTOMATION</p><h3>Seller outreach queue</h3></div><button className="primary-action"><CirclePlus size={15}/> Start campaign</button></div><div className="workflow-table"><div className="workflow-row header"><span>Seller / property</span><span>Channel</span><span>Consent</span><span>Next action</span><span>Status</span></div>{[['Oakwood Multifamily','SMS + Email','Verified','Follow-up today','Active'],['North Kenmore House','Voice','DNC clear','Call at 10:30 AM','Queued'],['Michigan Avenue Loft','Direct mail','Verified','Letter scheduled','Paused']].map(row=><div className="workflow-row" key={row[0]}>{row.map((cell,i)=><span key={cell} className={i===4?'workflow-status':''}>{cell}</span>)}</div>)}</div></div>}
    {active==='Offers & contracts'&&<div className="workflow-panel"><div className="workflow-head"><div><p>HUMAN APPROVAL REQUIRED</p><h3>Offer & contract approvals</h3></div><button className="primary-action"><FileCheck2 size={15}/> Generate offer</button></div><div className="workflow-table"><div className="workflow-row header"><span>Deal</span><span>Contract</span><span>Amount</span><span>Review</span><span>Status</span></div>{[['Oakwood Multifamily','PSA',' $785,000','Legal + owner','Pending approval'],['North Kenmore House','LOI',' $420,000','Investor','Approved'],['Michigan Avenue Loft','Novation',' $365,000','Counsel','Draft']].map(row=><div className="workflow-row" key={row[0]}>{row.map((cell,i)=><span key={cell} className={i===4?'workflow-status':''}>{cell}</span>)}</div>)}</div></div>}
    {active==='Capital'&&<div className="workflow-panel"><div className="workflow-head"><div><p>LENDER MARKETPLACE</p><h3>Recommended capital programs</h3></div><button className="primary-action"><Landmark size={15}/> Generate binder</button></div><div className="lender-grid">{[['Local DSCR Prime','DSCR','70% LTV','1.25x DSCR'],['Agency Multifamily','Agency','75% LTV','1.30x DSCR'],['Flexible Bridge','Bridge','75% LTV','12-month term']].map(row=><article key={row[0]}><div className="lender-logo"><Landmark size={18}/></div><strong>{row[0]}</strong><span>{row[1]}</span><div><b>{row[2]}</b><b>{row[3]}</b></div><button>View terms</button></article>)}</div></div>}
    {active==='Due diligence'&&<div className="workflow-panel"><div className="workflow-head"><div><p>DILIGENCE ORCHESTRATION</p><h3>Parallel contingency tracks</h3></div><button className="primary-action"><CirclePlus size={15}/> Launch diligence</button></div><div className="workflow-table"><div className="workflow-row header"><span>Track</span><span>Vendor</span><span>Deadline</span><span>Documents</span><span>Status</span></div>{[['Inspection','Alpha Inspections','Dec 3','Report pending','Scheduled'],['Title','Chicago Title','Dec 5','Commitment uploaded','In review'],['Appraisal','Metro Appraisals','Dec 7','Ordered','Pending'],['Environmental','Greenfield Engineering','Dec 10','Scope sent','Scheduled']].map(row=><div className="workflow-row" key={row[0]}>{row.map((cell,i)=><span key={cell} className={i===4?'workflow-status':''}>{cell}</span>)}</div>)}</div></div>}
    {active==='Vendors & RFQs'&&<div className="workflow-panel"><div className="workflow-head"><div><p>COMPETITIVE RFQ MARKETPLACE</p><h3>Bid and award desk</h3></div><button className="primary-action"><Wrench size={15}/> Broadcast RFQ</button></div><div className="workflow-table"><div className="workflow-row header"><span>Vendor</span><span>Trade</span><span>Bid</span><span>Variance</span><span>Status</span></div>{[['Northline Construction','GC','$82,400','+$4,200','Bid received'],['Crown Roofing','Roofing','$18,900','-$1,100','Recommended'],['Metro HVAC','HVAC','$12,300','+$2,600','Outlier review']].map(row=><div className="workflow-row" key={row[0]}>{row.map((cell,i)=><span key={cell} className={i===4?'workflow-status':''}>{cell}</span>)}</div>)}</div></div>}
    {active==='Closing'&&<div className="workflow-panel"><div className="workflow-head"><div><p>DIGITAL CLOSING WAR ROOM</p><h3>Closing readiness</h3></div><button className="primary-action"><FileCheck2 size={15}/> Review closing</button></div><div className="closing-check-grid">{[['Title commitment','Reviewed','clear'],['ALTA / HUD-1','1 variance','$1,500'],['Hazard insurance','Bound','active'],['RON notary','Scheduled','Dec 15'],['Wire verification','Required','pending']].map(row=><article key={row[0]}><strong>{row[0]}</strong><span>{row[1]}</span><b>{row[2]}</b></article>)}</div></div>}
  </section>
}

function PropertyForm({onClose}:{onClose:()=>void}){return <><p className="modal-kicker">NEW OPPORTUNITY</p><h2>Add a property</h2><p className="modal-description">Create a new deal and begin underwriting.</p><form onSubmit={e=>{e.preventDefault();onClose()}}><label>Property address<input required placeholder="1234 Main Street"/></label><div className="form-row"><label>City<input required placeholder="Chicago"/></label><label>State<select><option>IL</option><option>TX</option><option>FL</option><option>GA</option></select></label></div><div className="form-row"><label>Property type<select><option>Single family</option><option>Multifamily</option><option>Condo</option><option>Commercial</option></select></label><label>Purchase price<input required placeholder="$425,000"/></label></div><button className="submit-button" type="submit">Create opportunity</button></form></>}
