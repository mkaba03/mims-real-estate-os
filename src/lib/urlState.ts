export type ReosView='Overview'|'Deal Explorer'|'Underwriting'|'Creative Finance'|'Outreach'|'Offers & Contracts'|'Capital'|'Due Diligence'|'Vendors & RFQs'|'Closing'|'Construction'|'Property Management'|'Reports'|'AI Agents'|'Integrations'|'Documents'|'Billing'|'API / MCP'|'Team'|'Settings'

export function readUrlState():{view:ReosView;dealId:string|null}{
 const params=new URLSearchParams(location.search)
 const view=(params.get('view')||'Overview') as ReosView
 const dealId=params.get('dealId')
 return{view,dealId}
}

export function writeUrlState(view:ReosView,dealId:string){
 const params=new URLSearchParams(location.search)
 params.set('view',view)
 params.set('dealId',dealId)
 history.replaceState(null,'',`${location.pathname}?${params.toString()}`)
}
