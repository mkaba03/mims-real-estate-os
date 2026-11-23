import { describe,it,expect } from 'vitest'
import { signSession } from './auth'
import jwt from 'jsonwebtoken'

describe('tenant authentication foundation',()=>{
  it('signs and verifies a tenant session',()=>{
    const token=signSession({tenantId:'tenant-a',userId:'user-a',role:'OWNER',email:'owner@example.com'})
    expect(typeof token).toBe('string')
    const payload=jwt.verify(token,process.env.REOS_JWT_SECRET||'development-only-change-before-production') as any
    expect(payload.tenantId).toBe('tenant-a')
  })
})
