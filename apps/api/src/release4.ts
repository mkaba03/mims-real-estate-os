import crypto from 'node:crypto'

export type DrawMilestone = {name:string;drawAmount:number;verificationPhotoUrls:string[]}

export function verifyRehabDraw(milestone:DrawMilestone, humanApproved:boolean) {
  const photoVerified = milestone.verificationPhotoUrls.length>=2
  const approved = photoVerified && humanApproved && milestone.drawAmount>0
  return {
    milestoneId:crypto.randomUUID(),
    status:approved?'APPROVED_FOR_PAYMENT':'REVIEW_REQUIRED',
    photoVerified,
    humanApproved,
    drawAmount:milestone.drawAmount,
  }
}

export function calculateScheduleENoi(entries:{entryType:'INCOME'|'EXPENSE';amount:number}[]) {
  const income = entries.filter(entry=>entry.entryType==='INCOME').reduce((sum,entry)=>sum+entry.amount,0)
  const expenses = entries.filter(entry=>entry.entryType==='EXPENSE').reduce((sum,entry)=>sum+entry.amount,0)
  return {income,expenses,noi:income-expenses}
}

export function triageMaintenance(description:string, approvedSpendCap:number) {
  const urgent = /gas|leak|flood|sparking|fire|no heat|no ac/i.test(description)
  const priority = urgent?'EMERGENCY':'ROUTINE'
  return {
    priority,
    dispatchRequired:true,
    approvedSpendCap,
    initialAction:urgent?'Dispatch emergency trade immediately':'Create vendor work order and schedule diagnostic visit',
  }
}

export function createPostCloseChecklist(propertyId:string) {
  return {
    propertyId,
    utilities:['Electric','Water','Gas','Trash','Internet','HOA'],
    tasks:['Utility activation','Vendor mobilization','Rehab baseline','Disposition strategy','Leasing screening','Accounting setup'],
    status:'IN_PROGRESS',
  }
}
