import type { InternshipConfig, InternshipJob } from './policy.ts'
import { evaluateInternshipRules, validateInternshipConfig } from './policy.ts'

export type DeliveryStage = 'reserved' | 'contacted' | 'sent' | 'uncertain' | 'cancelled'
export interface DeliveryRecord {
  account: string
  jobKey: string
  hrId: string
  jobName: string
  company: string
  link: string
  stage: DeliveryStage
  updatedAt: number
}

export interface DeliveryActions {
  isStopped(): boolean
  matchWithAI(): Promise<{ matches: boolean; reason: string }>
  reserve(): Promise<boolean>
  publish(): Promise<void>
  greet(message: string): Promise<void>
  settle(stage: DeliveryStage): Promise<void>
}

// 所有发送入口都经过同一套检查；发送结果不确定时不自动重试。
export async function executeInternshipDelivery(
  job: InternshipJob, config: InternshipConfig, actions: DeliveryActions,
): Promise<{ sent: boolean; reason: string }> {
  const errors = validateInternshipConfig(config)
  if (errors.length) throw new Error(errors.join('；'))
  const rules = evaluateInternshipRules(job, config)
  if (!rules.matches) return { sent: false, reason: rules.reason }
  if (actions.isStopped()) return { sent: false, reason: '已停止' }
  if (config.aiEnabled) {
    const decision = await actions.matchWithAI()
    if (typeof decision.matches !== 'boolean' || !decision.reason?.trim()) {
      throw new Error('AI 匹配结果无效，已暂停')
    }
    if (!decision.matches) return { sent: false, reason: decision.reason }
  }
  if (actions.isStopped()) return { sent: false, reason: '已停止' }
  if (!await actions.reserve()) return { sent: false, reason: '该岗位或 HR 已联系，或上次发送结果待核对' }
  if (actions.isStopped()) {
    await actions.settle('cancelled')
    return { sent: false, reason: '发送前已停止' }
  }
  try {
    await actions.publish()
    await actions.settle('contacted')
    if (actions.isStopped()) throw new Error('已建立沟通后停止，固定话术尚未发送，请手动核对')
    await actions.greet(config.greeting)
    await actions.settle('sent')
    return { sent: true, reason: '固定打招呼语已发送' }
  } catch (error) {
    try { await actions.settle('uncertain') } catch { /* 预留记录仍会阻止重复发送。 */ }
    throw error
  }
}
