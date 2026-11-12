<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import InternshipPanel from '@/components/InternshipPanel.vue'
import JobCards from '@/components/JobCards.vue'
import Logs from '@/components/Tabs/Logs.vue'
import { useConf } from '@/composables/conf'
import { useModel } from '@/composables/useModel'
import { useHelper } from '@/composables/useHelper'

const conf = useConf()
const models = useModel()
const helper = useHelper()
const container = ref<HTMLElement>()
const items = [{ label: '实习海投', slot: 'internship' }, { label: '运行日志', slot: 'logs' }]
async function refresh() {
  if (helper.workflow?.busy.value) return
  await conf.confInit()
  await Promise.all([models.initModel(), helper.statistics.updateStatistics()])
}
onMounted(() => { void refresh(); window.addEventListener('focus', refresh) })
onUnmounted(() => window.removeEventListener('focus', refresh))
</script>

<template>
  <div ref="container" class="mx-auto my-6 w-full max-w-6xl px-3">
    <UApp :portal="container" :toaster="{ position: 'top-right' }">
      <UTabs :items="items" :unmount-on-hide="false" variant="link">
        <template #internship><InternshipPanel /></template>
        <template #logs><Logs /></template>
      </UTabs>
      <details class="mt-5 rounded-xl border border-gray-200 bg-white p-4">
        <summary class="cursor-pointer text-sm">岗位处理详情与跳过原因</summary>
        <JobCards />
      </details>
    </UApp>
  </div>
</template>
