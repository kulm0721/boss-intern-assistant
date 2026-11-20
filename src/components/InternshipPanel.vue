<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useConf } from '@/composables/conf'
import { useHelper } from '@/composables/useHelper'
import { useModel } from '@/composables/useModel'
import { counter } from '@/message'
import { splitKeywords, validateInternshipConfig, validateRunLimits } from '@/internship/policy'
import type { DeliveryRecord } from '@/internship/delivery'

const conf = useConf()
const helper = useHelper()
const models = useModel()
const form = computed(() => conf.formData.internship)
const running = computed(() => helper.workflow?.busy.value ?? false)
const saving = ref(false)
const message = ref('')
const customGreetingConfirmed = ref(false)
const greetingMode = computed({
  get: () => form.value.greetingMode ?? 'platform',
  set: (value: 'platform' | 'custom') => { form.value.greetingMode = value },
})
watch([greetingMode, () => helper.uid], () => { customGreetingConfirmed.value = false })
const records = ref<DeliveryRecord[]>([])
const results = computed(() => [...helper.jobResultMaps.values()])
const skipped = computed(() => results.value.filter((item) => item.status === 'warn').length)
const stages: Record<string, string> = {
  reserved: '待核对：已预留', contacted: '已建立沟通（固定话术未发送）', sent: '固定话术已发送',
  uncertain: '发送结果待核对', cancelled: '发送前已停止',
}

function setSalary(key: 'minDailySalary' | 'maxDailySalary', event: Event) {
  const value = (event.target as HTMLInputElement).value
  form.value[key] = value === '' ? null : Number(value)
}
async function refreshHistory() {
  try { records.value = await counter.listInternshipDeliveries(helper.uid) }
  catch (error) { message.value = `记录读取失败：${String(error)}` }
}
async function save() {
  saving.value = true
  try {
    await conf.confSaving({ silent: true })
    message.value = '设置已保存在本机，下次打开可继续修改。'
  } catch (error) { message.value = `保存失败：${String(error)}` }
  finally { saving.value = false }
}
async function start() {
  const errors = [...validateInternshipConfig(form.value), ...validateRunLimits(conf.formData.deliveryLimit.value, conf.formData.delayDeliveryInterval)]
  if (errors.length) { message.value = errors.join('；'); return }
  if (greetingMode.value === 'custom' && !customGreetingConfirmed.value) {
    message.value = '请先在 BOSS 关闭自动打招呼，并勾选本轮确认，避免平台招呼和固定话术连续发送。'
    return
  }
  if (!helper.jobList.value.length) { message.value = '当前还没有岗位，请先使用 BOSS 搜索实习岗位。'; return }
  saving.value = true
  try { await conf.confSaving({ silent: true }) }
  catch (error) { message.value = `保存失败，未启动：${String(error)}`; return }
  finally { saving.value = false }
  helper.customGreetingConfirmed.value = customGreetingConfirmed.value
  message.value = greetingMode.value === 'custom'
    ? '正在筛选，通过后会建立沟通并发送固定话术。'
    : '正在筛选，通过后只建立沟通，插件不追加话术。'
  try {
    await helper.start('auto')
    message.value = helper.workflow?.errorMessage.value
      ? `已暂停：${helper.workflow.errorMessage.value}。请先核对记录，再重新启动。`
      : '本轮已停止或完成，可查看下方投递记录和岗位处理结果。'
  } catch (error) { message.value = `启动失败：${String(error)}` }
  finally {
    helper.customGreetingConfirmed.value = false
    customGreetingConfirmed.value = false
  }
  await refreshHistory()
}
async function search() {
  if (!splitKeywords(form.value.directions).length) { message.value = '请先填写岗位方向。'; return }
  try { await conf.confSaving({ silent: true }) } catch { message.value = '保存失败，未跳转'; return }
  const url = new URL('https://www.zhipin.com/web/geek/jobs')
  url.searchParams.set('query', `${splitKeywords(form.value.directions)[0]} 实习`)
  const city = new URL(location.href).searchParams.get('city')
  if (city && /^\d+$/.test(city)) url.searchParams.set('city', city)
  location.href = url.href
}
function exportRecords() {
  const data = records.value.map(({ account: _account, hrId: _hrId, ...record }) => record)
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url; a.download = 'internship-deliveries.json'; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
onMounted(refreshHistory)
</script>

<template>
  <section class="intern-panel">
    <header class="intro">
      <div><span class="eyebrow">BOSS INTERN ASSISTANT</span><h2>把时间留给面试。</h2>
        <p>只筛实习岗位，按你选择的方式建立沟通。</p></div>
      <span class="state" :class="{ active: running }">{{ running ? '正在处理岗位' : '等待启动' }}</span>
    </header>
    <div class="metrics">
      <div><strong>{{ helper.jobList.value.length }}</strong><span>当前候选岗位</span></div>
      <div><strong>{{ helper.statistics.todayData.value.success }}</strong><span>今日完成联系</span></div>
      <div><strong>{{ skipped }}</strong><span>本页已跳过</span></div>
    </div>
    <fieldset :disabled="running || saving" class="settings">
      <div class="grid">
        <label>岗位方向 <input v-model="form.directions" placeholder="填写方向，多个方向用逗号分隔" autocomplete="off" /><small>岗位标题命中任一方向；同时必须明确标注实习。</small></label>
        <label>目标城市 <input v-model="form.cities" placeholder="填写城市，多个城市用逗号分隔" autocomplete="off" /><small>按工作城市核对，无法确认城市的岗位会跳过。</small></label>
        <label>最低日薪 · 元/天 <input type="number" min="0" :value="form.minDailySalary ?? ''" @input="setSalary('minDailySalary', $event)" placeholder="留空不限" /><small>岗位公布的日薪下限不能低于这个值。</small></label>
        <label>最高日薪 · 元/天 <input type="number" min="0" :value="form.maxDailySalary ?? ''" @input="setSalary('maxDailySalary', $event)" placeholder="留空不限" /><small>设置后，岗位公布的日薪上限也须符合。</small></label>
      </div>
      <p class="hint">填写日薪要求后，月薪、时薪、面议或无法解析的薪资会跳过，不自动换算。</p>
      <label>打招呼方式 <select v-model="greetingMode" data-testid="greeting-mode">
        <option value="platform">只使用 BOSS 自带招呼（插件不追加消息）</option>
        <option value="custom">发送固定话术（须先关闭 BOSS 自动打招呼）</option>
      </select></label>
      <p class="hint">建立沟通时 BOSS 可能自动发送招呼。插件无法读取或关闭该开关，请在 <a href="https://www.zhipin.com/web/geek/notify-set?type=greetSet" target="_blank" rel="noopener noreferrer">BOSS 打招呼设置</a> 中核对。只使用 BOSS 模式不会发送下方保存的固定话术；平台是否发送请查看聊天记录。</p>
      <template v-if="greetingMode === 'custom'">
        <label class="greeting">你的固定打招呼语 <textarea v-model="form.greeting" rows="4" placeholder="粘贴你已经写好的打招呼语，系统将原样发送。" /><small>AI 只判断岗位匹配度；话术不改写、不代聊。</small></label>
        <label class="check"><input type="checkbox" v-model="customGreetingConfirmed" data-testid="greeting-confirmation" />我已在当前 BOSS 账号关闭自动打招呼，本轮只由插件发送固定话术</label>
        <p class="hint">此确认仅本轮有效。若平台设置未关闭，仍可能收到两条招呼；修改后请先少量核对。</p>
      </template>
      <details class="ai" open>
        <summary>AI 辅助匹配</summary>
        <label class="check"><input type="checkbox" v-model="form.aiEnabled" data-testid="ai-enabled" />启用 AI，在规则通过后再核对岗位描述</label>
        <div v-if="form.aiEnabled" class="grid">
          <label>匹配模型 <select v-model="form.model"><option value="">请选择已配置的模型</option><option v-for="model in models.modelData.value" :key="model.key" :value="model.key">{{ model.name }}</option></select><button type="button" class="link" @click="counter.openOptionsPage()">配置模型与 API 密钥</button></label>
          <label>补充匹配要求（可选）<textarea v-model="form.notes" rows="2" placeholder="填写岗位方向之外需要 AI 核对的偏好" /></label>
        </div>
        <p class="hint">只向你配置的模型服务发送岗位信息和筛选条件。AI 请求失败或返回格式错误时暂停本轮。</p>
      </details>
      <div class="limits">
        <label>每日联系上限（含待核对） <input type="number" v-model.number="conf.formData.deliveryLimit.value" min="1" max="150" /></label>
        <label>处理间隔 · 秒 <input type="number" v-model.number="conf.formData.delayDeliveryInterval" min="3" max="300" /></label>
      </div>
    </fieldset>
    <div class="actions">
      <button v-if="!running" class="primary" :disabled="saving" @click="start">启动实习海投 <span>→</span></button>
      <button v-else class="stop" @click="helper.stop()">停止本轮</button>
      <button :disabled="running || saving" @click="save">保存设置</button>
      <button :disabled="running || saving" @click="search">打开实习搜索</button>
    </div>
    <p class="hint">从 BOSS 当前搜索结果开始，自动加载后续岗位。“打开实习搜索”使用第一个方向；城市范围请同时在 BOSS 原生筛选中选择。改变设置后重新启动。</p>
    <p v-if="message || helper.workflow?.errorMessage.value" class="message" role="status">{{ message || helper.workflow?.errorMessage.value }}</p>
    <div class="history-heading"><h3>本机投递记录</h3><div><button @click="refreshHistory">刷新</button><button :disabled="!records.length" @click="exportRecords">导出记录</button></div></div>
    <p class="hint">同一岗位或 HR 不重复联系。待核对的发送不会自动重试，请去 BOSS 聊天确认。</p>
    <div v-if="records.length" class="history"><table><thead><tr><th>岗位 / 公司</th><th>状态</th><th>时间</th></tr></thead><tbody><tr v-for="record in records.slice(0, 30)" :key="record.jobKey"><td><a :href="record.link" target="_blank" rel="noopener noreferrer">{{ record.jobName }}</a><small>{{ record.company }}</small></td><td>{{ stages[record.stage] }}</td><td>{{ new Date(record.updatedAt).toLocaleString() }}</td></tr></tbody></table></div>
    <div v-else class="empty">还没有发送记录。填写设置后，从当前岗位列表开始。</div>
  </section>
</template>


