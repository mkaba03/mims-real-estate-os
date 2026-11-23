import { describe,it,expect } from 'vitest'
import { MockListingProvider,deduplicateListings } from './providerAdapters'
import { pricingTiers, consumeCredit, meterOverage } from './subscriptions'

describe('source provider foundation',()=>{
  it('searches source adapters and normalizes listings',async()=>{
    const provider=new MockListingProvider('MLS')
    const listings=await provider.search('IL','Chicago')
    expect(listings).toHaveLength(2)
  })
  it('deduplicates listings into resolved properties',()=>{
    const results=deduplicateListings([
      {externalId:'1',source:'MLS',address:'100 Main',city:'Chicago',state:'IL',zip:'60601',askingPrice:400000,propertyType:'SINGLE_FAMILY',status:'ACTIVE'},
      {externalId:'2',source:'OFF_MARKET',address:'100 Main',city:'Chicago',state:'IL',zip:'60601',askingPrice:390000,propertyType:'SINGLE_FAMILY',status:'ACTIVE'},
    ])
    expect(results).toHaveLength(1)
    expect(results[0].sources).toContain('OFF_MARKET')
  })
})

describe('subscription and metering foundation',()=>{
  it('exposes the roadmap pricing tiers',()=>expect(pricingTiers.ENTERPRISE.monthly).toBe(1999))
  it('blocks credit consumption below balance',()=>expect(consumeCredit(1,.15).ok).toBe(true))
  it('returns metered overage price',()=>expect(meterOverage('ESIGN').overagePrice).toBe(1.25))
})
