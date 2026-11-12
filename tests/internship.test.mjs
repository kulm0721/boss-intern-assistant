import test from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { evaluateInternshipRules, parseDailySalary, parseInternshipAiDecision, validateInternshipConfig, internshipPrompt } from '../src/internship/policy.ts'
import { executeInternshipDelivery } from '../src/internship/delivery.ts'
import { reserveDelivery, settleDelivery, listDeliveries } from '../src/internship/history.ts'
import { validateRunLimits } from '../src/internship/policy.ts'

const config = { directions: 'Java,后端', cities: '上海市,杭州', minDailySalary: 150, maxDailySalary: null, greeting: '用户自己的话术 {{ 保留原样 }}', aiEnabled: true, model: 'test-model', notes: '' }
const job = { key: 'job-1', jobName: 'Java 后端实习生', jobDescription: '参与后端服务开发', salary: '150-250元/天', city: '上海', address: '上海市徐汇区', jobLabels: [] }
function actions(overrides = {}) {
  const calls = []
  return { calls, isStopped: () => false, matchWithAI: async () => ({ matches: true, reason: '匹配后端实习' }), reserve: async () => { calls.push('reserve'); return true }, publish: async () => { calls.push('publish') }, greet: async (text) => { calls.push(['greet', text]) }, settle: async (stage) => { calls.push(stage) }, ...overrides }
}

test('明确实习、岗位方向、精确城市与日薪下限一起判断', () => {
  assert.equal(evaluateInternshipRules(job, config).matches, true)
  for (const changed of [
    { jobName: 'Java 工程师', jobDescription: '有实习经验优先' },
    { jobName: 'Java 非实习岗位' }, { jobName: 'Java 社招实习经理' },
    { city: '北京', address: '北京市上海路' }, { city: undefined, address: '' },
    { salary: '100-300元/天' }, { salary: '10-20K' }, { salary: '面议' },
    { jobName: '销售实习生' },
  ]) assert.equal(evaluateInternshipRules({ ...job, ...changed }, config).matches, false, JSON.stringify(changed))
  assert.equal(evaluateInternshipRules({ ...job, jobName: 'Java 开发', jobLabels: ['实习'] }, config).matches, true)
})
test('日薪单位明确，倒置、混合、月薪和时薪不猜测', () => {
  assert.deepEqual(parseDailySalary('150～250 元/天'), [150, 250])
  assert.deepEqual(parseDailySalary('200/日'), [200, 200])
  for (const value of ['3-5K', '20元/时', '0元/天', '300-200元/天', '150-200元/天或5000元/月']) assert.equal(parseDailySalary(value), null)
  assert.equal(evaluateInternshipRules({ ...job, salary: '面议' }, { ...config, minDailySalary: null }).matches, true)
  assert.equal(evaluateInternshipRules(job, { ...config, maxDailySalary: 200 }).matches, false)
})
test('空配置、颠倒薪资、缺少模型不允许启动', () => {
  assert.deepEqual(validateInternshipConfig(config), [])
  assert.ok(validateInternshipConfig({ ...config, directions: '', cities: '', greeting: '', model: '' }).length >= 4)
  assert.ok(validateInternshipConfig({ ...config, minDailySalary: 300, maxDailySalary: 200 }).length)
  assert.ok(validateInternshipConfig({ ...config, minDailySalary: NaN }).length)
})
test('AI 必须明确返回布尔判断及理由；不把字符串 true 当通过', () => {
  assert.deepEqual(parseInternshipAiDecision('```json\n{"matches":false,"reason":"方向不符"}\n```'), { matches: false, reason: '方向不符' })
  for (const text of ['{}', '[]', '{"matches":"true","reason":"yes"}', '{"matches":true,"reason":""}', '随便投吧']) assert.throws(() => parseInternshipAiDecision(text))
  assert.equal(internshipPrompt(config, job).includes(config.greeting), false)
})
test('非实习岗位或 AI 拒绝不会预留、建立沟通或发消息', async () => {
  const a = actions()
  assert.equal((await executeInternshipDelivery({ ...job, jobName: 'Java 正式岗' }, config, a)).sent, false)
  assert.deepEqual(a.calls, [])
  const b = actions({ matchWithAI: async () => ({ matches: false, reason: '方向不符' }) })
  assert.equal((await executeInternshipDelivery(job, config, b)).sent, false)
  assert.deepEqual(b.calls, [])
})
test('AI 超时或畸形结果直接报错，后续发送不发生', async () => {
  for (const ai of [async () => { throw new Error('AI timeout') }, async () => ({ matches: 'true', reason: 'bad' })]) {
    const a = actions({ matchWithAI: ai })
    await assert.rejects(executeInternshipDelivery(job, config, a))
    assert.deepEqual(a.calls, [])
  }
})
test('成功流程原样发送话术，并且先预留再发送再记成功', async () => {
  const a = actions()
  assert.equal((await executeInternshipDelivery(job, config, a)).sent, true)
  assert.deepEqual(a.calls, ['reserve', 'publish', 'contacted', ['greet', config.greeting], 'sent'])
})
test('重复岗位或发送中停止均不发话术', async () => {
  const a = actions({ reserve: async () => false })
  assert.equal((await executeInternshipDelivery(job, config, a)).sent, false)
  assert.deepEqual(a.calls, [])
  let stopped = false
  const b = actions({ isStopped: () => stopped, publish: async () => { stopped = true } })
  await assert.rejects(executeInternshipDelivery(job, config, b), /停止/)
  assert.equal(b.calls.some((call) => Array.isArray(call)), false)
  assert.ok(b.calls.includes('uncertain'))
})
test('消息发送故障只尝试一次，结果记录为待核对', async () => {
  let count = 0
  const a = actions({ greet: async () => { count++; throw new Error('network') } })
  await assert.rejects(executeInternshipDelivery(job, config, a), /network/)
  assert.equal(count, 1)
  assert.deepEqual(a.calls, ['reserve', 'publish', 'contacted', 'uncertain'])
})
test('关闭 AI 时规则仍执行，发送前停止可取消预留', async () => {
  let checks = 0
  const a = actions({ isStopped: () => ++checks === 3, matchWithAI: async () => { throw new Error('不应调用') } })
  const res = await executeInternshipDelivery(job, { ...config, aiEnabled: false, model: '' }, a)
  assert.equal(res.sent, false)
  assert.deepEqual(a.calls, ['reserve', 'cancelled'])
})
test('数据库事务阻止两个标签页同时联系同一 HR，重开连接仍去重', async () => {
  const base = { account: 'test-account-1', jobKey: 'a', hrId: 'hr-a', jobName: '实习', company: 'test', link: '', stage: 'reserved', updatedAt: Date.now() }
  const results = await Promise.all([reserveDelivery(base), reserveDelivery({ ...base, jobKey: 'b' })])
  assert.deepEqual(results.sort(), [false, true])
  await settleDelivery(base.account, base.jobKey, 'uncertain')
  assert.equal(await reserveDelivery(base), false)
  const saved = await listDeliveries(base.account)
  assert.equal(saved.length, 1)
  assert.equal(saved[0].stage, 'uncertain')
  assert.deepEqual(await listDeliveries('other-account'), [])
})
test('发送前取消允许重试；已沟通记录不能通过取消绕过去重', async () => {
  const base = { account: 'test-account-2', jobKey: 'c', hrId: 'hr-c', jobName: '实习', company: 'test', link: '', stage: 'reserved', updatedAt: Date.now() }
  assert.equal(await reserveDelivery(base), true)
  await settleDelivery(base.account, base.jobKey, 'cancelled')
  assert.equal(await reserveDelivery(base), true)
  await settleDelivery(base.account, base.jobKey, 'contacted')
  await assert.rejects(settleDelivery(base.account, base.jobKey, 'cancelled'))
  assert.equal(await reserveDelivery(base), false)
})

test('NaN、空值和越界运行参数不会让每日上限失效', () => {
  assert.deepEqual(validateRunLimits(120, 5), [])
  for (const [limit, seconds] of [[NaN, 5], [0, 5], [151, 5], [1.5, 5], [120, NaN], [120, 0]]) {
    assert.ok(validateRunLimits(limit, seconds).length)
  }
})

test('同一账号两个不同 HR 并发也无法突破每日联系上限', async () => {
  const base = { account: 'test-daily-limit', jobKey: 'first', hrId: 'first', jobName: '实习', company: 'test', link: '', stage: 'reserved', updatedAt: Date.now() }
  const result = await Promise.allSettled([reserveDelivery(base, 1), reserveDelivery({ ...base, jobKey: 'second', hrId: 'second' }, 1)])
  assert.equal(result.filter((item) => item.status === 'fulfilled' && item.value).length, 1)
  assert.equal(result.filter((item) => item.status === 'rejected').length, 1)
  assert.equal((await listDeliveries(base.account)).length, 1)
})
