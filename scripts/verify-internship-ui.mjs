import puppeteer from 'puppeteer'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const extension = resolve('.output/chrome-mv3')
const browser = await puppeteer.launch({
  executablePath: process.env.INTERN_TEST_BROWSER || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true, pipe: true, userDataDir: resolve(`.test-profiles/ui-${Date.now()}`),
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`, '--no-first-run', '--disable-background-networking'],
})
try {
  const worker = await browser.waitForTarget((target) => target.type() === 'service_worker' && target.url().endsWith('/background.js'), { timeout: 15000 })
  const extensionUrl = new URL(worker.url())
  const origin = `${extensionUrl.protocol}//${extensionUrl.host}`
  console.log('EXTENSION:', worker.url())
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (error) => { errors.push(String(error)); console.log('PAGE ERROR:', String(error)) })
  page.on('console', (item) => { if (item.type() === 'error') console.log('PAGE CONSOLE:', item.text()) })
  page.on('requestfailed', (request) => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText))
  const network = await page.createCDPSession()
  await network.send('Network.enable')
  await network.send('Network.setBlockedURLs', { urls: ['http://*', 'https://*'] })
  await page.setViewport({ width: 1180, height: 1350, deviceScaleFactor: 1 })
  await page.goto(`${origin}/demo.html`)
  try { await page.waitForSelector('.intern-panel', { timeout: 10000 }) }
  catch (error) { console.log('PAGE BODY:', await page.$eval('body', (body) => body.innerHTML)); console.log('PAGE TITLE:', await page.title()); throw error }
  const inputs = await page.$$('input:not([type])')
  await inputs[0].type('Java')
  await inputs[1].type('上海')
  const salary = await page.$('input[type=number]')
  await salary.type('150')
  assert.equal(await page.$eval('[data-testid="greeting-mode"]', (node) => node.value), 'platform')
  await page.select('[data-testid="greeting-mode"]', 'custom')
  await page.type('.greeting textarea', '你好，我想应聘贵公司的实习岗位。')
  await page.click('[data-testid="ai-enabled"]')
  await page.click('button.primary')
  await page.waitForFunction(() => document.querySelector('.message')?.textContent.includes('请先在 BOSS 关闭自动打招呼'))
  assert.equal(await page.$$eval('tbody tr', (rows) => rows.length), 0)
  await page.click('[data-testid="greeting-confirmation"]')
  await page.click('button.primary')
  await page.waitForFunction(() => document.querySelector('.message')?.textContent.includes('本轮已停止或完成'))
  assert.equal(await page.$$eval('tbody tr', (rows) => rows.length), 1)
  assert.deepEqual(await page.$$eval('.metrics strong', (nodes) => nodes.map((node) => node.textContent)), ['4', '1', '3'])
  assert.ok((await page.$eval('tbody', (element) => element.textContent)).includes('话术已发送'))
  assert.equal(await page.$eval('[data-testid="greeting-confirmation"]', (node) => node.checked), false)
  await mkdir('docs/images', { recursive: true })
  await page.screenshot({ path: 'docs/images/offline-demo.png', fullPage: true })
  await page.reload()
  await page.waitForSelector('.intern-panel')
  assert.deepEqual(await page.$$eval('input:not([type])', (nodes) => nodes.map((node) => node.value)), ['Java', '上海'])
  assert.equal(await page.$eval('[data-testid="greeting-confirmation"]', (node) => node.checked), false)
  await page.click('[data-testid="greeting-confirmation"]')
  await page.click('button.primary')
  await page.waitForFunction(() => document.querySelector('.message')?.textContent.includes('本轮已停止或完成'))
  assert.equal(await page.$$eval('tbody tr', (rows) => rows.length), 1)
  await page.select('[data-testid="greeting-mode"]', 'platform')
  const city = (await page.$$('input:not([type])'))[1]
  await city.click()
  await page.keyboard.down('Control')
  await page.keyboard.press('KeyA')
  await page.keyboard.up('Control')
  await city.press('Backspace')
  await city.type('北京')
  await page.click('button.primary')
  await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 2)
  assert.equal(await page.$$eval('tbody tr', (rows) => rows.length), 2)
  assert.ok((await page.$eval('tbody', (element) => element.textContent)).includes('固定话术未发送'))
  assert.deepEqual(errors, [])
  await page.goto(`${origin}/options.html`)
  await page.waitForFunction(() => document.body.textContent.includes('新建模型'))
  assert.deepEqual(errors, [])
  console.log('UI PASS: real extension + offline fixture, filtering, fixed greeting flow, reload persistence, deduplication, options render. No HTTP requests allowed.')
} finally { await browser.close() }
