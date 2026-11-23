import { describe, expect, it } from 'vitest'
import { verifyRehabDraw, calculateScheduleENoi, triageMaintenance, createPostCloseChecklist } from './release4'

describe('Release 4 post-close foundations',()=>{
  it('requires photos and human approval for draw release',()=>{
    expect(verifyRehabDraw({name:'Roof',drawAmount:18000,verificationPhotoUrls:['a','b']},true).status).toBe('APPROVED_FOR_PAYMENT')
  })
  it('calculates Schedule E NOI',()=>{
    expect(calculateScheduleENoi([{entryType:'INCOME',amount:30000},{entryType:'EXPENSE',amount:12000}]).noi).toBe(18000)
  })
  it('escalates emergency maintenance',()=>{
    expect(triageMaintenance('Active water leak and flooding',500).priority).toBe('EMERGENCY')
  })
  it('creates all utility activation tracks',()=>{
    expect(createPostCloseChecklist('property-1').utilities).toContain('Electric')
  })
})
