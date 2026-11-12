<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useModel } from '@/composables/useModel'
import ProvidersPage from './pages/ProvidersPage.vue'
const models = useModel()
const ready = ref(false)
const busy = ref(false)
const error = ref('')
onMounted(async () => {
  try { await models.initModel(); ready.value = true }
  catch (e) { error.value = String(e) }
})
async function save() {
  busy.value = true
  try { await models.saveModel() } catch (e) { error.value = String(e) }
  finally { busy.value = false }
}
</script>
<template>
  <UApp>
    <main class="mx-auto max-w-4xl p-8 space-y-6">
      <header><h1 class="text-2xl font-semibold">实习海投助手 · 模型设置</h1><p class="mt-3 text-sm text-muted">岗位方向、城市、日薪和固定话术在 BOSS 网页中填写。这里配置用于岗位匹配的模型。</p></header>
      <p class="text-sm">API 密钥保存在本机扩展存储中。AI 仅判断岗位匹配，不生成或改写打招呼语。</p>
      <p v-if="error" role="alert" class="text-red-600">{{ error }}</p>
      <template v-if="ready"><ProvidersPage /><UButton :loading="busy" @click="save">保存模型设置</UButton><p class="text-sm text-muted">保存后返回 BOSS 页面，在“AI 辅助匹配”中选择模型。</p></template>
    </main>
  </UApp>
</template>
