import { openDB } from 'idb'
import type { DeliveryRecord, DeliveryStage } from './delivery.ts'

async function database() {
  return openDB('BossInternshipHistory', 1, {
    upgrade(db) {
      db.createObjectStore('jobs', { keyPath: ['account', 'jobKey'] })
      db.createObjectStore('hrs', { keyPath: ['account', 'hrId'] })
    },
  })
}

export async function reserveDelivery(record: DeliveryRecord, dailyLimit = 120): Promise<boolean> {
  if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 150) throw new Error('每日联系上限无效')
  if (!record.account || !record.jobKey || !record.hrId) throw new Error('账号、岗位或 HR 标识缺失，暂停发送')
  const db = await database()
  try {
    const tx = db.transaction(['jobs', 'hrs'], 'readwrite')
    const jobs = tx.objectStore('jobs')
    const hrs = tx.objectStore('hrs')
    const job = await jobs.get([record.account, record.jobKey]) as DeliveryRecord | undefined
    const hr = await hrs.get([record.account, record.hrId]) as DeliveryRecord | undefined
    if ([job, hr].some((item) => item && item.stage !== 'cancelled')) {
      await tx.done
      return false
    }
    const all = await jobs.getAll() as DeliveryRecord[]
    const today = new Date().toDateString()
    const count = all.filter((item) => item.account === record.account && item.stage !== 'cancelled' &&
      new Date(item.updatedAt).toDateString() === today).length
    if (count >= dailyLimit) { await tx.done; throw new Error('已达到本机设置的每日联系上限（含待核对记录）') }
    const pending = { ...record, stage: 'reserved', updatedAt: Date.now() }
    await jobs.put(pending)
    await hrs.put(pending)
    await tx.done
    return true
  } finally { db.close() }
}

export async function settleDelivery(account: string, jobKey: string, stage: DeliveryStage) {
  const db = await database()
  try {
    const tx = db.transaction(['jobs', 'hrs'], 'readwrite')
    const record = await tx.objectStore('jobs').get([account, jobKey]) as DeliveryRecord | undefined
    if (!record) throw new Error('发送预留记录缺失，暂停发送')
    if (stage === 'cancelled' && record.stage !== 'reserved') throw new Error('已开始沟通的记录不能取消去重')
    const updated = { ...record, stage, updatedAt: Date.now() }
    await tx.objectStore('jobs').put(updated)
    await tx.objectStore('hrs').put(updated)
    await tx.done
  } finally { db.close() }
}

export async function listDeliveries(account: string): Promise<DeliveryRecord[]> {
  const db = await database()
  try {
    const records = await db.getAll('jobs') as DeliveryRecord[]
    return records.filter((record) => record.account === account).sort((a, b) => b.updatedAt - a.updatedAt)
  } finally { db.close() }
}
