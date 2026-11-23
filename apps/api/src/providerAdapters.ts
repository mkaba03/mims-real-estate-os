export type ListingSource = 'MLS'|'OFF_MARKET'|'TAX_DEED'|'PROBATE'|'HUD'|'AUCTION_COM'|'LAND_BANK'

export interface SourceListing {
  externalId:string
  source:ListingSource
  address:string
  city:string
  state:string
  zip:string
  askingPrice:number
  propertyType:string
  status:string
}

export class MockListingProvider {
  constructor(private source:ListingSource) {}
  async search(state:string, city?:string):Promise<SourceListing[]> {
    const area=city||'Target market'
    return [
      {externalId:`${this.source}-001`,source:this.source,address:`100 ${area} Opportunity Ave`,city:area,state:state.toUpperCase(),zip:'60601',askingPrice:425000,propertyType:'SINGLE_FAMILY',status:'ACTIVE'},
      {externalId:`${this.source}-002`,source:this.source,address:`250 ${area} Investment Blvd`,city:area,state:state.toUpperCase(),zip:'60602',askingPrice:785000,propertyType:'MULTIFAMILY',status:'ACTIVE'},
    ]
  }
}

export function deduplicateListings(listings:SourceListing[]) {
  const normalized=new Map<string,SourceListing & {sources:ListingSource[]}>()
  for(const listing of listings){
    const key=`${listing.address.toLowerCase().replace(/[^a-z0-9]/g,'')}-${listing.zip}`
    const existing=normalized.get(key)
    if(existing){ existing.sources=[...new Set([...existing.sources,listing.source])]; continue }
    normalized.set(key,{...listing,sources:[listing.source]})
  }
  return [...normalized.values()].map((listing,index)=>({id:`resolved-${index+1}`,...listing,propensity:{retail:78,wholesale:84,creative:72,auction:thisSourceIsAuction(listing.source)?91:45}}))
}

function thisSourceIsAuction(source:ListingSource){return source==='AUCTION_COM'||source==='TAX_DEED'}

export function calculatePropensity(listing:{askingPrice:number;propertyType:string;status:string}) {
  const base=listing.status==='ACTIVE'?68:58
  const multifamily=listing.propertyType==='MULTIFAMILY'?8:0
  return {retail:Math.min(100,base+multifamily),wholesale:Math.min(100,base+12),creative:Math.min(100,base+4),auction:listing.status.includes('AUCTION')?90:55}
}
