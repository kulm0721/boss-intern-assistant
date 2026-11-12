import ui from '@nuxt/ui/vue-plugin'
import UApp from '@nuxt/ui/components/App.vue'
import { createApp, defineComponent, h, provide, reactive, ref, onMounted } from 'vue'
import { initExtensionCounter } from '@/message'

async function main() {
  initExtensionCounter()
  const [{ default: Panel }, { useConf }, { HelperKey }, { useModel }, { executeInternshipDelivery }, { counter }] = await Promise.all([
    import('@/components/InternshipPanel.vue'), import('@/composables/conf'), import('@/composables/useHelper'),
    import('@/composables/useModel'), import('@/internship/delivery'), import('@/message'),
  ])
  const jobs = [
    { key: 'demo-java', jobName: 'Java 后端实习生', salary: '200-300元/天', city: '上海', address: '上海市徐汇区', jobDescription: '参与接口开发与测试', jobLabels: [] },
    { key: 'demo-fulltime', jobName: 'Java 后端工程师', salary: '15-25K', city: '上海', address: '上海市', jobDescription: '有实习经历优先', jobLabels: [] },
    { key: 'demo-other-city', jobName: 'Java 实习生', salary: '200元/天', city: '北京', address: '北京市', jobDescription: 'Java 开发', jobLabels: [] },
    { key: 'demo-low-salary', jobName: 'Java 实习生', salary: '80-100元/天', city: '上海', address: '上海市', jobDescription: 'Java 开发', jobLabels: [] },
  ]
  const Root = defineComponent({ setup() {
    const conf = useConf()
    const models = useModel()
    const ready = ref(false)
    const workflow = { busy: ref(false), status: ref('pending'), errorMessage: ref<string | null>(null) }
    const statistics = { todayData: ref({ success: 0 }) }
    const jobResultMaps = reactive(new Map())
    const helper = {
      uid: 'offline-demo', jobList: ref(jobs), statistics, jobResultMaps, workflow,
      stop() { workflow.status.value = 'stop' },
      async start() {
        workflow.busy.value = true; workflow.status.value = 'running'; workflow.errorMessage.value = null
        try {
          for (const job of jobs) {
            const result = await executeInternshipDelivery(job, structuredClone(toRaw(conf.formData.internship)), {
              isStopped: () => workflow.status.value !== 'running',
              matchWithAI: async () => { throw new Error('离线演示不调用 AI，请关闭 AI 后体验规则筛选') },
              reserve: () => counter.reserveInternshipDelivery({ account: 'offline-demo', jobKey: job.key, hrId: job.key, jobName: job.jobName, company: '离线示例公司', link: '', stage: 'reserved', updatedAt: Date.now() }, conf.formData.deliveryLimit.value),
              publish: async () => {}, greet: async () => {},
              settle: (stage) => counter.settleInternshipDelivery('offline-demo', job.key, stage),
            })
            jobResultMaps.set(job.key, { status: result.sent ? 'success' : 'warn', reason: result.reason })
            if (result.sent) statistics.todayData.value.success++
          }
        } finally { workflow.busy.value = false; workflow.status.value = 'pending' }
      },
    }
    provide(HelperKey, helper as never)
    onMounted(async () => { await conf.confInit(); await models.initModel(); ready.value = true })
    return () => h(UApp, {}, { default: () => h('main', { style: 'max-width:1080px;margin:24px auto;padding:12px' }, [
      h('p', { style: 'padding:14px;background:#fff0c9;border-radius:8px;margin-bottom:16px' }, '离线演示 · 使用 4 个示例岗位，不访问 BOSS、不发送真实消息。关闭 AI 后可体验规则筛选。'),
      ready.value ? h(Panel) : h('p', '正在加载演示…'),
    ]) })
  } })
  createApp(Root).use(ui).mount('#app')
}
void main().catch((error) => { document.body.textContent = `演示加载失败：${String(error)}` })
