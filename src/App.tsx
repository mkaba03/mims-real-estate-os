import { useState } from 'react'
import {
  LayoutDashboard, Search, Building2, BarChart3, BriefcaseBusiness,
  Landmark, ClipboardCheck, Hammer, Settings, Bell, HelpCircle,
  MapPin, Plus, SlidersHorizontal, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, ChevronDown, Heart, TrendingUp, Clock3, X,
} from 'lucide-react'
import './App.css'

const initialProperties = [
  { id: 1, address: '1842 W. Roscoe St.', city: 'Chicago, IL', type: 'Multifamily', units: '3 units', price: '$785,000', arv: '$1,020,000', roi: '18.4%', status: 'High potential', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80' },
  { id: 2, address: '5427 N. Kenmore Ave.', city: 'Chicago, IL', type: 'Single family', units: '1 unit', price: '$420,000', arv: '$548,000', roi: '15.7%', status: 'New listing', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80' },
  { id: 3, address: '2916 S. Michigan Ave.', city: 'Chicago, IL', type: 'Condo', units: '2 units', price: '$365,000', arv: '$465,000', roi: '12.9%', status: 'Needs review', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=80' },
]

const nav = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Deal search', icon: Search },
  { label: 'Properties', icon: Building2 },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Pipeline', icon: BriefcaseBusiness },
  { label: 'Capital', icon: Landmark },
  { label: 'Closing', icon: ClipboardCheck },
  { label: 'Construction', icon: Hammer },
]

function App() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [period, setPeriod] = useState('30D')
  const [saved, setSaved] = useState<number[]>([])
  const [properties, setProperties] = useState(initialProperties)
  const [modal, setModal] = useState<'add' | 'filters' | 'help' | null>(null)
  const [notifications, setNotifications] = useState(false)
  const [propertyType, setPropertyType] = useState('All types')
  const [search, setSearch] = useState('')

  const visibleProperties = properties.filter(property => {
    const matchesType = propertyType === 'All types' || property.type === propertyType
    const matchesSearch = !search || `${property.address} ${property.city}`.toLowerCase().includes(search.toLowerCase())
    return matchesType && matchesSearch
  })

  const pageTitles: Record<string, string> = {
    Overview: 'Good morning, Michael',
    'Deal search': 'Deal search',
    Properties: 'Property portfolio',
    Analytics: 'Investment analytics',
    Pipeline: 'Active deal pipeline',
    Capital: 'Capital & lender placement',
    Closing: 'Closing coordination',
    Construction: 'Construction management',
  }

  function addProperty(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const address = String(data.get('address') || 'New property')
    const city = String(data.get('city') || 'Chicago, IL')
    const price = String(data.get('price') || '$0')
    setProperties(current => [{
      id: Date.now(), address, city, type: String(data.get('type') || 'Single family'),
      units: '1 unit', price, arv: '$0', roi: 'Pending', status: 'New listing',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80',
    }, ...current])
    setModal(null)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand"><div className="brand-mark"><Building2 size={20} /></div><span>RE-OS</span></div>
          <nav>
            {nav.map(({ label, icon: Icon }) => (
              <button key={label} className={activeNav === label ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveNav(label); setNotifications(false) }}>
                <Icon size={18} /><span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setModal('help')}><Settings size={18} /><span>Settings</span></button>
          <button className="profile" onClick={() => setModal('help')}><div className="avatar">MK</div><div><strong>Michael Kaba</strong><small>Investor account</small></div><ChevronDown size={16} /></button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><p className="eyebrow">{activeNav.toUpperCase()}</p><h1>{pageTitles[activeNav]}</h1></div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Help" onClick={() => setModal('help')}><HelpCircle size={19} /></button>
            <div className="notification-wrap">
              <button className="icon-button notification" aria-label="Notifications" onClick={() => setNotifications(value => !value)}><Bell size={19} /><span /></button>
              {notifications && <div className="notification-menu"><strong>Notifications</strong><p>Three deals are closing soon.</p><p>August NOI report is ready.</p></div>}
            </div>
            <button className="primary-button" onClick={() => setModal('add')}><Plus size={17} /> Add property</button>
          </div>
        </header>

        {activeNav !== 'Overview' ? (
          <section className="module-view">
            <article className="module-hero"><div><p className="eyebrow">RE-OS MODULE</p><h2>{activeNav}</h2><p>{activeNav === 'Deal search' ? 'Search and prioritize opportunities across your target markets.' : 'Review and manage this part of the real estate investment lifecycle.'}</p></div><button className="primary-button" onClick={() => activeNav === 'Deal search' ? setSearch('') : setModal('add')}><Plus size={16}/>{activeNav === 'Deal search' ? 'Clear search' : `Add ${activeNav.toLowerCase()} record`}</button></article>
            {activeNav === 'Deal search' && <div className="module-search"><Search size={18}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search address or city" /></div>}
            <div className="module-cards">
              {['Sourcing','Underwriting','Under contract','Diligence','Closing','Post-close'].map((stage, index) => <article key={stage}><div className="module-card-icon"><BriefcaseBusiness size={18}/></div><span>{stage}</span><strong>{[5,3,2,2,1,4][index]}</strong><small>active records</small></article>)}
            </div>
          </section>
        ) : (
          <>
            <section className="metrics-grid">
              <article className="metric-card"><div className="metric-head"><span>Portfolio value</span><MoreHorizontal size={18} /></div><strong>$4.82M</strong><div className="metric-change positive"><ArrowUpRight size={14} /> 8.2% <span>vs last month</span></div></article>
              <article className="metric-card"><div className="metric-head"><span>Annual NOI</span><MoreHorizontal size={18} /></div><strong>$318.4K</strong><div className="metric-change positive"><ArrowUpRight size={14} /> 12.5% <span>vs last month</span></div></article>
              <article className="metric-card"><div className="metric-head"><span>Average cash-on-cash</span><MoreHorizontal size={18} /></div><strong>14.8%</strong><div className="metric-change negative"><ArrowDownRight size={14} /> 1.3% <span>vs last month</span></div></article>
              <article className="metric-card"><div className="metric-head"><span>Active deals</span><MoreHorizontal size={18} /></div><strong>12</strong><div className="metric-change neutral"><Clock3 size={14} /> 3 <span>closing soon</span></div></article>
            </section>

            <section className="content-grid">
              <article className="panel performance-panel">
                <div className="panel-header"><div><h2>Portfolio performance</h2><p>Net operating income</p></div><div className="period-switch">{['7D','30D','3M','1Y'].map(p => <button key={p} className={period === p ? 'selected' : ''} onClick={() => setPeriod(p)}>{p}</button>)}</div></div>
                <div className="chart-wrap"><div className="chart-y"><span>$35k</span><span>$26k</span><span>$17k</span><span>$8k</span><span>$0</span></div><div className="chart"><div className="grid-lines"><i/><i/><i/><i/><i/></div><svg viewBox="0 0 700 220" preserveAspectRatio="none" aria-label="Portfolio performance chart"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6d76ff" stopOpacity="0.24"/><stop offset="1" stopColor="#6d76ff" stopOpacity="0"/></linearGradient></defs><path d="M0 180 C55 168 75 155 125 158 C180 161 195 128 245 137 C295 146 312 110 360 116 C420 124 432 78 485 92 C535 104 570 55 620 68 C650 76 674 36 700 42 L700 220 L0 220 Z" fill="url(#area)"/><path d="M0 180 C55 168 75 155 125 158 C180 161 195 128 245 137 C295 146 312 110 360 116 C420 124 432 78 485 92 C535 104 570 55 620 68 C650 76 674 36 700 42" fill="none" stroke="#5966ee" strokeWidth="3"/><circle cx="485" cy="92" r="5" fill="#fff" stroke="#5966ee" strokeWidth="3"/></svg><div className="chart-tooltip"><span>{period} performance</span><strong>{period === '7D' ? '$6,140' : period === '30D' ? '$24,580' : period === '3M' ? '$71,920' : '$318,400'}</strong></div></div></div>
                <div className="chart-x"><span>Jul 22</span><span>Jul 29</span><span>Aug 05</span><span>Aug 12</span><span>Aug 19</span><span>Aug 26</span></div>
              </article>
              <article className="panel pipeline-panel"><div className="panel-header"><div><h2>Deal pipeline</h2><p>12 active opportunities</p></div><button className="text-button" onClick={() => setActiveNav('Pipeline')}>View all <ArrowUpRight size={14}/></button></div><div className="pipeline-list">{[['Sourcing','5'],['Underwriting','3'],['Under contract','2'],['Diligence','2']].map(([label,count], i) => <div className="pipeline-row" key={label}><div className="pipeline-info"><div className={`stage-dot stage-${i}`}><BriefcaseBusiness size={14}/></div><span>{label}</span></div><strong>{count}</strong></div>)}</div></article>
            </section>

            <section className="properties-section">
              <div className="section-heading"><div><h2>Recommended properties</h2><p>Highest potential matches in your target markets</p></div><div className="section-actions"><button className="filter-button" onClick={() => setModal('filters')}><SlidersHorizontal size={16}/> Filters</button><button className="text-button" onClick={() => setActiveNav('Deal search')}>View marketplace <ArrowUpRight size={14}/></button></div></div>
              <div className="property-grid">{visibleProperties.map(property => <article className="property-card" key={property.id}><div className="property-image" style={{backgroundImage:`url(${property.image})`}}><span className={property.status === 'Needs review' ? 'status amber' : 'status'}>{property.status}</span><button className={saved.includes(property.id) ? 'save saved' : 'save'} aria-label="Save property" onClick={() => setSaved(s => s.includes(property.id) ? s.filter(id => id !== property.id) : [...s, property.id])}><Heart size={17} fill={saved.includes(property.id) ? 'currentColor' : 'none'}/></button></div><div className="property-body"><p className="property-type">{property.type} · {property.units}</p><h3>{property.address}</h3><p className="location"><MapPin size={14}/>{property.city}</p><div className="property-values"><div><span>Price</span><strong>{property.price}</strong></div><div><span>Est. ARV</span><strong>{property.arv}</strong></div><div><span>Projected ROI</span><strong className="roi"><TrendingUp size={13}/>{property.roi}</strong></div></div></div></article>)}</div>
            </section>
          </>
        )}
      </main>

      {modal && <div className="modal-backdrop" onMouseDown={() => setModal(null)}><div className="modal" onMouseDown={event => event.stopPropagation()}><button className="modal-close" onClick={() => setModal(null)}><X size={18}/></button>
        {modal === 'add' && <><h2>Add a property</h2><p>Create a new opportunity in your portfolio.</p><form onSubmit={addProperty}><label>Address<input name="address" required placeholder="123 Market Street" /></label><label>City / state<input name="city" required placeholder="Chicago, IL" /></label><label>Property type<select name="type"><option>Single family</option><option>Multifamily</option><option>Condo</option><option>Commercial</option><option>Land</option></select></label><label>Purchase price<input name="price" required placeholder="$425,000" /></label><button className="primary-button modal-submit" type="submit">Add property</button></form></>}
        {modal === 'filters' && <><h2>Property filters</h2><p>Filter recommended opportunities.</p><label>Property type<select value={propertyType} onChange={event => setPropertyType(event.target.value)}><option>All types</option><option>Single family</option><option>Multifamily</option><option>Condo</option></select></label><label>Address search<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Address or city" /></label><button className="primary-button modal-submit" onClick={() => setModal(null)}>Apply filters</button></>}
        {modal === 'help' && <><h2>RE-OS workspace</h2><p>This prototype supports navigation, saved properties, property creation, filters, chart periods, notifications, and module views.</p><button className="primary-button modal-submit" onClick={() => setModal(null)}>Continue</button></>}
      </div></div>}
    </div>
  )
}

export default App
