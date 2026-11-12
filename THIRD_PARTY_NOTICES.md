# 来源与修改说明

## Ocyss/boss-helper

- 来源：https://github.com/Ocyss/boss-helper
- 基础提交：7526ebab572a98823904e3cfb9f979a715fe58f6
- 许可证：MIT，原始声明完整保留于根目录 LICENSE。
- 本派生版新增实习规则、启动配置、严格发送流程、持久并发去重、离线演示和测试；修改 BOSS 建立沟通的重试行为、配置存储范围、运行界面、模型设置入口与构建配置。
- 当前仅本地开发，未向上游提交 PR，也未发布到浏览器商店。

## devlog-ui

- 上游引入的日志组件：https://github.com/Ocyss/devlog-ui
- 固定提交：2b1d950a859e0c0214a0f1068ccb615fe4f02479
- 许可证：MIT，见 vendor/devlog-ui/LICENSE。
- vendored 源码来自上述提交，仅移除测试目录，并将四处针对可选 Vite 环境字段的 TypeScript 指令由 expect-error 改为 ignore，兼容主项目提供了 Vite 类型的情形。
- 为让普通克隆即可构建，实际编译使用 vendor 目录，不依赖上游子模块初始化。

其余依赖与精确解析版本记录于 package.json 和 pnpm-lock.yaml，适用各自许可证。
