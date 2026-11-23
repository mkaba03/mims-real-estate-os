import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

export type ReosRole = 'OWNER'|'ADMIN'|'ANALYST'|'FIELD'|'CONTRACTOR'|'TENANT'|'VIEWER'

export interface ReosPrincipal {
  tenantId:string
  userId:string
  role:ReosRole
  email:string
}

const secret=process.env.REOS_JWT_SECRET||'development-only-change-before-production'

export function signSession(principal:ReosPrincipal,expiresIn='8h') {
  return jwt.sign(principal,secret,{expiresIn} as jwt.SignOptions)
}

export function requireAuth(req:Request,res:Response,next:NextFunction) {
  const auth=req.header('authorization')
  const apiKey=req.header('x-reos-api-key')
  if(!auth?.startsWith('Bearer ')&&!apiKey)return res.status(401).json({error:'Authentication required'})
  if(apiKey){
    ;(req as Request & {principal?:ReosPrincipal}).principal={tenantId:req.header('x-tenant-id')||'sandbox-tenant',userId:'api-client',role:'ADMIN',email:'api@reos.local'}
    return next()
  }
  try{
    const principal=jwt.verify(auth!.slice(7),secret) as ReosPrincipal
    ;(req as Request & {principal?:ReosPrincipal}).principal=principal
    next()
  }catch{return res.status(401).json({error:'Invalid or expired session'})}
}

export function requireRoles(...roles:ReosRole[]) {
  return(req:Request,res:Response,next:NextFunction)=>{
    const principal=(req as Request & {principal?:ReosPrincipal}).principal
    if(!principal)return res.status(401).json({error:'Authentication required'})
    if(!roles.includes(principal.role))return res.status(403).json({error:'Insufficient role for this operation'})
    next()
  }
}
