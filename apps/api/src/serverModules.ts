export const lenderPrograms = [
  {name:'Local DSCR Prime', type:'DSCR', minLtv:.55, maxLtv:.80, minDscr:1.05, propertyTypes:['Single family','Multifamily','Condo']},
  {name:'Flexible Bridge', type:'BRIDGE', minLtv:.30, maxLtv:.75, minDscr:.85, propertyTypes:['All']},
  {name:'Fix & Flip Advance', type:'HARD_MONEY', minLtv:.30, maxLtv:.70, minDscr:.75, propertyTypes:['All']},
  {name:'Agency Multifamily', type:'AGENCY', minLtv:.50, maxLtv:.75, minDscr:1.25, propertyTypes:['Multifamily']},
]

export function matchLenders(propertyType:string, ltv:number, dscr:number) {
  return lenderPrograms.filter(program => (program.propertyTypes.includes('All') || program.propertyTypes.includes(propertyType)) && ltv>=program.minLtv && ltv<=program.maxLtv && dscr>=program.minDscr)
}
