# CSGHub Finetune 组件单元测试

> 自动化测试套件，用于验证 Finetune 组件的功能正确性

## 🚀 快速开始

### 1. 进入项目目录

```bash
cd csghub/frontend
```

### 2. 安装依赖（首次运行）

```bash
npm install
```

### 3. 运行测试

```bash
# 运行测试并生成完整报告（推荐）
npm run test:finetune:coverage

# 或使用测试脚本
bash ../tests/scripts/run-finetune-tests.sh coverage
```

### 4. 查看报告

```bash
# 查看 Markdown 报告
cat ../tests/reports/FINETUNE-TEST-REPORT.md

# 在浏览器中打开覆盖率报告
open ../tests/reports/coverage/index.html
```

---

## 📊 测试概览

### 测试统计

| 指标 | 数值 |
|------|------|
| 测试套件 | 3 个 |
| 测试用例 | 159 个 |
| 测试通过率 | 100% |
| 平均覆盖率 | 71.90% |
| 分支覆盖率 | 88.56% |

### 测试文件

```
frontend/src/components/finetune/__tests__/
├── FinetuneDetail.spec.js    (38 个测试用例)
├── FinetuneSettings.spec.js  (67 个测试用例)
└── NewFinetune.spec.js        (54 个测试用例)
```

### 覆盖范围

- ✅ 组件渲染测试
- ✅ 表单验证测试
- ✅ 数据联动测试
- ✅ API 交互测试
- ✅ 错误处理测试
- ✅ 用户交互测试
- ✅ 生命周期测试
- ✅ 边界情况测试

---

## 📝 测试命令

### npm 命令

| 命令 | 说明 |
|------|------|
| `npm run test:finetune` | 运行所有 Finetune 测试 |
| `npm run test:finetune:coverage` | 运行测试并生成完整报告 |
| `npm run test:report` | 仅生成测试报告（需先运行测试） |

### 测试脚本

```bash
# 进入 frontend 目录
cd csghub/frontend

# 运行所有测试
bash ../tests/scripts/run-finetune-tests.sh

# 运行单个组件测试
bash ../tests/scripts/run-finetune-tests.sh new        # NewFinetune
bash ../tests/scripts/run-finetune-tests.sh settings   # FinetuneSettings
bash ../tests/scripts/run-finetune-tests.sh detail     # FinetuneDetail

# 运行测试并生成完整报告
bash ../tests/scripts/run-finetune-tests.sh coverage
```

---

## 📁 目录结构

```
tests/
├── scripts/                       # 测试脚本
│   ├── run-finetune-tests.sh     # 测试运行脚本
│   └── generate-test-report.js   # 报告生成脚本
├── reports/                       # 测试报告（自动生成）
│   ├── FINETUNE-TEST-REPORT.md   # Markdown 格式测试报告
│   ├── test-results.json         # JSON 格式测试结果
│   └── coverage/                 # 覆盖率报告
│       └── index.html            # HTML 覆盖率报告
└── README.md                      # 本文档
```

---

## 📈 测试报告

运行测试后，会自动生成以下报告：

### 1. Markdown 测试报告

**路径**：`tests/reports/FINETUNE-TEST-REPORT.md`

**内容**：
- 📊 测试执行摘要（通过率、失败数等）
- 📈 代码覆盖率统计
- 🧪 测试套件详情（每个测试用例的状态）
- 🎯 测试策略说明
- 🔍 未覆盖代码分析

### 2. HTML 覆盖率报告

**路径**：`tests/reports/coverage/index.html`

**内容**：
- 📊 可视化覆盖率图表
- 📁 文件级别覆盖率详情
- 🔍 未覆盖代码高亮显示
- 🖱️ 可交互的代码浏览

### 3. JSON 测试结果

**路径**：`tests/reports/test-results.json`

**用途**：供 CI/CD 系统或其他工具解析使用

---

## ⚙️ 配置说明

### vitest.config.js

测试配置位于 `frontend/vitest.config.js`：

```javascript
{
  test: {
    setupFiles: ['./setupTests.js'],
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/components/finetune/**/*.vue'],
      statements: 80,  // 语句覆盖率目标
      branches: 75,    // 分支覆盖率目标
      functions: 85,   // 函数覆盖率目标
      lines: 80        // 行覆盖率目标
    }
  }
}
```

### package.json 脚本

```json
{
  "scripts": {
    "test:finetune": "vitest --run src/components/finetune/__tests__/",
    "test:finetune:coverage": "vitest --run --coverage src/components/finetune/__tests__/ && node ../tests/scripts/generate-test-report.js",
    "test:report": "node ../tests/scripts/generate-test-report.js"
  }
}
```

---

## 🐛 常见问题

### 问题 1：找不到测试文件

**错误信息**：
```
No test files found
```

**解决方案**：
```bash
# 确保在 frontend 目录下运行
cd csghub/frontend

# 验证测试文件存在
ls -la src/components/finetune/__tests__/
```

### 问题 2：依赖未安装

**错误信息**：
```
Cannot find module 'xxx'
```

**解决方案**：
```bash
cd csghub/frontend
npm install
```

### 问题 3：测试报告未生成

**错误信息**：
```
❌ 错误：找不到测试结果文件
```

**解决方案**：
```bash
# 确保使用 --run 参数运行测试
npm run test:finetune:coverage
```

### 问题 4：权限错误

**错误信息**：
```
Permission denied: ./run-finetune-tests.sh
```

**解决方案**：
```bash
chmod +x ../tests/scripts/run-finetune-tests.sh
```

---

## 🎯 覆盖率目标

| 指标 | 目标 | 当前 | 状态 |
|------|------|------|------|
| 语句覆盖率 | ≥80% | 65.83% | 📊 待提升 |
| 分支覆盖率 | ≥75% | 88.56% | ✅ 达标 |
| 函数覆盖率 | ≥85% | 67.39% | 📊 待提升 |
| 行覆盖率 | ≥80% | 65.83% | 📊 待提升 |

---

## 🔗 CI/CD 集成

### GitHub Actions 示例

```yaml
name: Frontend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd frontend && npm install
      - name: Run tests
        run: cd frontend && npm run test:finetune:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./tests/reports/coverage/lcov.info
```

---

## 📚 测试编写规范

### 测试结构

```javascript
describe('组件名称', () => {
  describe('功能模块', () => {
    it('应该做某事', async () => {
      // Arrange - 准备测试数据和环境
      const wrapper = mount(Component, { ... })

      // Act - 执行操作
      await wrapper.find('button').trigger('click')

      // Assert - 验证结果
      expect(wrapper.text()).toContain('期望的文本')
    })
  })
})
```

### Mock 策略

1. **API Mock**: 使用 `vi.mock('@/packs/useFetchApi')` 模拟 API 调用
2. **Router Mock**: 使用 `vi.mock('vue-router')` 模拟路由
3. **Store Mock**: 使用 `createTestingPinia()` 模拟 Pinia Store
4. **SSE Mock**: 使用 `vi.mock('@microsoft/fetch-event-source')` 模拟 SSE

### 最佳实践

- ✅ **测试隔离**：每个测试用例独立运行，不依赖其他测试
- ✅ **清理资源**：在 `afterEach` 中清理 Mock 和组件
- ✅ **异步处理**：使用 `async/await` 处理异步操作
- ✅ **有意义的断言**：断言应该清晰表达预期行为
- ✅ **边界测试**：测试正常情况、边界情况和错误情况

---

## 📞 支持

如果遇到问题：

1. 检查本文档的常见问题部分
2. 查看测试文件中的注释
3. 查阅 [Vitest 官方文档](https://vitest.dev/)
4. 查阅 [Vue Test Utils 官方文档](https://test-utils.vuejs.org/)

---

**最后更新**：2026-02-06
**维护者**：CSGHub 开发团队
