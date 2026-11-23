import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, BarChart3, Bell, Building2, ChevronDown, CircleHelp, CirclePlus, Clock3, Command, Filter, Heart, Landmark, LayoutGrid, Menu, MoreHorizontal, Search, Settings, Sparkles, TrendingUp, Users, X } from 'lucide-react'
import './REOSApp.css'

const properties = [
  {id:1,name:'Oakwood Multifamily',address:'1842 W Roscoe St, Chicago, IL',type:'Multifamily',bed:'3 units',price:785000,arv:1020000,roi:18.4,status:'High potential',image:'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=82'},
  {id:2,name:'North Kenmore House',address:'5427 N Kenmore Ave, Chicago, IL',type:'Single family',bed:'4 bed · 2 bath',price:420000,arv:548000,roi:15.7,status:'New listing',image:'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=82'},
  {id:3,name:'Michigan Avenue Loft',address:'2916 S Michigan Ave, Chicago, IL',type:'Condo',bed:'2 bed · 2 bath',price:365000,arv:465000,roi:12.9,status:'Needs review',image:'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=82'},
]

const nav = [
  {label:'Overview',icon:LayoutGrid}, {label:'Deal explorer',icon:Search}, {label:'Properties',icon:Building2},
  {label:'Pipeline',icon:BarChart3}, {label:'Capital',icon:Landmark}, {label:'Reports',icon:TrendingUp},
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

function WorkspaceView({active,search,setSearch}:{active:string;search:string;setSearch:(v:string)=>void}){return <section className="workspace-view"><div className="workspace-banner"><div><p>REOS {active.toUpperCase()}</p><h2>{active==='Deal explorer'?'Discover stronger opportunities':`Manage ${active.toLowerCase()} from one place`}</h2><span>Real-time operational context across your portfolio.</span></div><button className="banner-button"><CirclePlus size={16}/> New record</button></div>{active==='Deal explorer'&&<div className="workspace-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by address, city, or property name"/><button><Command size={14}/>K</button></div>}<div className="workspace-grid">{['Sourcing','Underwriting','Outreach','Diligence','Closing','Operations'].map((stage,i)=><article key={stage}><div className="workspace-card-top"><span>{i+1}</span><MoreHorizontal size={17}/></div><p>{stage}</p><strong>{[8,5,4,3,2,6][i]}</strong><small>active items</small></article>)}</div></section>}

function PropertyForm({onClose}:{onClose:()=>void}){return <><p className="modal-kicker">NEW OPPORTUNITY</p><h2>Add a property</h2><p className="modal-description">Create a new deal and begin underwriting.</p><form onSubmit={e=>{e.preventDefault();onClose()}}><label>Property address<input required placeholder="1234 Main Street"/></label><div className="form-row"><label>City<input required placeholder="Chicago"/></label><label>State<select><option>IL</option><option>TX</option><option>FL</option><option>GA</option></select></label></div><div className="form-row"><label>Property type<select><option>Single family</option><option>Multifamily</option><option>Condo</option><option>Commercial</option></select></label><label>Purchase price<input required placeholder="$425,000"/></label></div><button className="submit-button" type="submit">Create opportunity</button></form></>}
