import express from 'express'
import crypto from 'node:crypto'

export function mountMcpServer(app:express.Express,underwrite:(input:any)=>any) {
  app.post('/mcp',async(req,res)=>{
    const apiKey=req.header('x-reos-api-key')
    const tenantId=req.header('x-tenant-id')
    if(!apiKey||!tenantId)return res.status(401).json({error:'Missing MCP tenant credentials'})
    const tool=req.body?.name
    const args=req.body?.arguments||{}

    if(tool==='underwrite_property_all_strategies'){
      return res.json({jsonrpc:'2.0',id:req.body?.id||null,result:{content:[{type:'text',text:JSON.stringify(underwrite(args))}]}})
    }
    if(tool==='search_real_estate_deals'){
      return res.json({jsonrpc:'2.0',id:req.body?.id||null,result:{content:[{type:'text',text:JSON.stringify([{address:'1842 W Roscoe St',state:'IL',source:'MLS',propensityScore:84},{address:'5427 N Kenmore Ave',state:'IL',source:'OFF_MARKET',propensityScore:78}])}]}})
    }
    if(tool==='get_portfolio_schedule_e_summary'){
      return res.json({jsonrpc:'2.0',id:req.body?.id||null,result:{content:[{type:'text',text:JSON.stringify({tenantId,taxYear:args.taxYear||2026,noi:318400,entries:[]})}]}})
    }

    return res.status(404).json({jsonrpc:'2.0',id:req.body?.id||null,error:{code:-32601,message:'Unknown MCP tool'}})
  })

  app.get('/api/v1/mcp/tools',(_req,res)=>res.json({data:[
    {name:'search_real_estate_deals',scope:'read',description:'Search omnibus sourcing channels'},
    {name:'underwrite_property_all_strategies',scope:'write',description:'Run deterministic strategy underwriting'},
    {name:'broadcast_vendor_rfq',scope:'write',description:'Create and broadcast a vendor RFQ'},
    {name:'get_portfolio_schedule_e_summary',scope:'read',description:'Retrieve Schedule E portfolio summary'},
  ]}))
}
