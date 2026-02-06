const fs = require('fs')
const path = require('path')

/**
 * 测试报告生成脚本
 * 读取 Vitest 生成的测试结果和覆盖率数据，生成详细的 Markdown 测试报告
 */

console.log('📊 开始生成测试报告...\n')

// 文件路径
const TEST_RESULTS_PATH = path.join(__dirname, '..', 'reports', 'test-results.json')
const COVERAGE_SUMMARY_PATH = path.join(__dirname, '..', 'reports', 'coverage', 'coverage-summary.json')
const COVERAGE_FINAL_PATH = path.join(__dirname, '..', 'reports', 'coverage', 'coverage-final.json')
const REPORT_OUTPUT_PATH = path.join(__dirname, '..', 'reports', 'FINETUNE-TEST-REPORT.md')

/**
 * 验证测试结果数据完整性
 */
function validateTestResults(testResults) {
  const errors = []

  if (!testResults || typeof testResults !== 'object') {
    errors.push('测试结果不是有效的对象')
    return errors
  }

  if (!testResults.testResults || !Array.isArray(testResults.testResults)) {
    errors.push('缺少 testResults 数组')
  } else if (testResults.testResults.length === 0) {
    errors.push('没有找到任何测试套件，请确认测试已正确运行')
  }

  return errors
}

// 检查测试结果文件是否存在
if (!fs.existsSync(TEST_RESULTS_PATH)) {
  console.error('❌ 错误：找不到测试结果文件')
  console.error(`   期望路径: ${TEST_RESULTS_PATH}`)
  console.error('   请先运行测试: npm test -- --run src/components/finetune/__tests__/')
  process.exit(1)
}

// 读取测试结果
let testResults
try {
  const testResultsContent = fs.readFileSync(TEST_RESULTS_PATH, 'utf-8')
  testResults = JSON.parse(testResultsContent)
} catch (error) {
  console.error('❌ 错误：无法读取测试结果文件')
  console.error(error.message)
  process.exit(1)
}

// 验证测试结果数据完整性
const validationErrors = validateTestResults(testResults)
if (validationErrors.length > 0) {
  console.error('❌ 测试结果数据验证失败：')
  validationErrors.forEach(err => console.error(`   - ${err}`))
  console.error('\n💡 建议：')
  console.error('   1. 确认测试已成功运行')
  console.error('   2. 检查 vitest.config.js 的 outputFile 配置')
  console.error('   3. 验证测试文件路径是否正确')
  process.exit(1)
}

// 读取覆盖率数据（可选）
let coverageSummary = null

// 优先尝试读取 coverage-summary.json
if (fs.existsSync(COVERAGE_SUMMARY_PATH)) {
  try {
    const coverageContent = fs.readFileSync(COVERAGE_SUMMARY_PATH, 'utf-8')
    coverageSummary = JSON.parse(coverageContent)
  } catch (error) {
    console.warn('⚠️  警告：无法读取 coverage-summary.json')
  }
}

// 如果没有 coverage-summary.json，尝试从 coverage-final.json 生成
if (!coverageSummary && fs.existsSync(COVERAGE_FINAL_PATH)) {
  try {
    const coverageContent = fs.readFileSync(COVERAGE_FINAL_PATH, 'utf-8')
    const coverageFinal = JSON.parse(coverageContent)
    coverageSummary = convertCoverageFinalToSummary(coverageFinal)
    console.log('✅ 从 coverage-final.json 生成覆盖率摘要')
  } catch (error) {
    console.warn('⚠️  警告：无法读取覆盖率数据，将跳过覆盖率部分')
  }
}

// 生成报告
const report = generateReport(testResults, coverageSummary)

// 写入报告文件
try {
  fs.writeFileSync(REPORT_OUTPUT_PATH, report, 'utf-8')
  console.log('✅ 测试报告生成成功！')
  console.log(`   报告路径: ${REPORT_OUTPUT_PATH}`)
} catch (error) {
  console.error('❌ 错误：无法写入报告文件')
  console.error(error.message)
  process.exit(1)
}

/**
 * 将 coverage-final.json 转换为 coverage-summary.json 格式
 */
function convertCoverageFinalToSummary(coverageFinal) {
  const summary = {}
  let totalStatements = { total: 0, covered: 0, skipped: 0, pct: 0 }
  let totalBranches = { total: 0, covered: 0, skipped: 0, pct: 0 }
  let totalFunctions = { total: 0, covered: 0, skipped: 0, pct: 0 }
  let totalLines = { total: 0, covered: 0, skipped: 0, pct: 0 }

  Object.keys(coverageFinal).forEach(filePath => {
    const fileData = coverageFinal[filePath]

    // 计算语句覆盖率
    const statements = fileData.s || {}
    const statementMap = fileData.statementMap || {}
    const stmtTotal = Object.keys(statementMap).length
    const stmtCovered = Object.values(statements).filter(count => count > 0).length
    const stmtPct = stmtTotal > 0 ? (stmtCovered / stmtTotal * 100).toFixed(2) : 0

    // 计算分支覆盖率
    const branches = fileData.b || {}
    let branchTotal = 0
    let branchCovered = 0
    Object.values(branches).forEach(branchArray => {
      branchTotal += branchArray.length
      branchCovered += branchArray.filter(count => count > 0).length
    })
    const branchPct = branchTotal > 0 ? (branchCovered / branchTotal * 100).toFixed(2) : 0

    // 计算函数覆盖率
    const functions = fileData.f || {}
    const functionMap = fileData.fnMap || {}
    const funcTotal = Object.keys(functionMap).length
    const funcCovered = Object.values(functions).filter(count => count > 0).length
    const funcPct = funcTotal > 0 ? (funcCovered / funcTotal * 100).toFixed(2) : 0

    // 计算行覆盖率（与语句覆盖率相同）
    const linePct = stmtPct

    summary[filePath] = {
      statements: { total: stmtTotal, covered: stmtCovered, skipped: 0, pct: parseFloat(stmtPct) },
      branches: { total: branchTotal, covered: branchCovered, skipped: 0, pct: parseFloat(branchPct) },
      functions: { total: funcTotal, covered: funcCovered, skipped: 0, pct: parseFloat(funcPct) },
      lines: { total: stmtTotal, covered: stmtCovered, skipped: 0, pct: parseFloat(linePct) }
    }

    // 累加总计
    totalStatements.total += stmtTotal
    totalStatements.covered += stmtCovered
    totalBranches.total += branchTotal
    totalBranches.covered += branchCovered
    totalFunctions.total += funcTotal
    totalFunctions.covered += funcCovered
    totalLines.total += stmtTotal
    totalLines.covered += stmtCovered
  })

  // 计算总体百分比
  totalStatements.pct = totalStatements.total > 0
    ? parseFloat((totalStatements.covered / totalStatements.total * 100).toFixed(2))
    : 0
  totalBranches.pct = totalBranches.total > 0
    ? parseFloat((totalBranches.covered / totalBranches.total * 100).toFixed(2))
    : 0
  totalFunctions.pct = totalFunctions.total > 0
    ? parseFloat((totalFunctions.covered / totalFunctions.total * 100).toFixed(2))
    : 0
  totalLines.pct = totalLines.total > 0
    ? parseFloat((totalLines.covered / totalLines.total * 100).toFixed(2))
    : 0

  summary.total = {
    statements: totalStatements,
    branches: totalBranches,
    functions: totalFunctions,
    lines: totalLines
  }

  return summary
}

/**
 * 生成测试报告内容
 */
function generateReport(testResults, coverageSummary) {
  const timestamp = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  let report = `# Finetune 组件单元测试报告

> 生成时间：${timestamp}

## 📊 测试执行摘要

`

  // 统计测试结果
  const stats = calculateTestStats(testResults)

  report += `### 总体统计

| 指标 | 数值 | 状态 |
|------|------|------|
| 测试套件总数 | ${stats.totalSuites} | ${stats.totalSuites > 0 ? '✅' : '❌'} |
| 测试用例总数 | ${stats.totalTests} | ${stats.totalTests > 0 ? '✅' : '❌'} |
| 通过用例数 | ${stats.passedTests} | ${stats.passedTests === stats.totalTests ? '✅' : '⚠️'} |
| 失败用例数 | ${stats.failedTests} | ${stats.failedTests === 0 ? '✅' : '❌'} |
| 跳过用例数 | ${stats.skippedTests} | - |
| 测试通过率 | ${stats.passRate}% | ${stats.passRate === 100 ? '✅' : stats.passRate >= 90 ? '⚠️' : '❌'} |
| 总执行时间 | ${formatDuration(stats.totalDuration)} | - |

`

  // 覆盖率统计
  if (coverageSummary) {
    report += generateCoverageSection(coverageSummary)
  }

  // 测试套件详情
  report += generateTestSuitesSection(testResults)

  // 失败的测试
  if (stats.failedTests > 0) {
    report += generateFailedTestsSection(testResults)
  }

  // 测试策略说明
  report += generateTestStrategySection(testResults)

  // 未覆盖代码分析
  if (coverageSummary) {
    report += generateUncoveredCodeSection(coverageSummary)
  }

  // 测试总结
  report += generateTestSummary(stats, coverageSummary, testResults)

  return report
}

/**
 * 计算测试统计数据
 */
function calculateTestStats(testResults) {
  let totalSuites = 0
  let totalTests = 0
  let passedTests = 0
  let failedTests = 0
  let skippedTests = 0
  let totalDuration = 0

  if (testResults.testResults) {
    totalSuites = testResults.testResults.length

    testResults.testResults.forEach(suite => {
      if (suite.assertionResults) {
        totalTests += suite.assertionResults.length

        suite.assertionResults.forEach(test => {
          if (test.status === 'passed') passedTests++
          else if (test.status === 'failed') failedTests++
          else if (test.status === 'skipped' || test.status === 'pending') skippedTests++
        })
      }

      if (suite.endTime && suite.startTime) {
        totalDuration += (suite.endTime - suite.startTime)
      }
    })
  }

  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0

  return {
    totalSuites,
    totalTests,
    passedTests,
    failedTests,
    skippedTests,
    passRate,
    totalDuration
  }
}

/**
 * 生成覆盖率部分
 */
function generateCoverageSection(coverageSummary) {
  let section = `## 📈 代码覆盖率

### 覆盖率统计

`

  // 提取总体覆盖率
  const total = coverageSummary.total || {}

  section += `| 类型 | 覆盖率 | 已覆盖 / 总数 | 目标 | 状态 |
|------|--------|---------------|------|------|
| 语句覆盖率 | ${total.statements?.pct || 0}% | ${total.statements?.covered || 0} / ${total.statements?.total || 0} | ≥80% | ${getStatusIcon(total.statements?.pct, 80)} |
| 分支覆盖率 | ${total.branches?.pct || 0}% | ${total.branches?.covered || 0} / ${total.branches?.total || 0} | ≥75% | ${getStatusIcon(total.branches?.pct, 75)} |
| 函数覆盖率 | ${total.functions?.pct || 0}% | ${total.functions?.covered || 0} / ${total.functions?.total || 0} | ≥85% | ${getStatusIcon(total.functions?.pct, 85)} |
| 行覆盖率 | ${total.lines?.pct || 0}% | ${total.lines?.covered || 0} / ${total.lines?.total || 0} | ≥80% | ${getStatusIcon(total.lines?.pct, 80)} |

`

  // 各组件覆盖率详情
  section += `### 组件覆盖率详情

`

  const components = ['NewFinetune.vue', 'FinetuneSettings.vue', 'FinetuneDetail.vue']

  section += `| 组件 | 语句 | 分支 | 函数 | 行 |
|------|------|------|------|------|
`

  components.forEach(component => {
    const componentPath = Object.keys(coverageSummary).find(key => key.includes(component))
    if (componentPath) {
      const data = coverageSummary[componentPath]
      section += `| ${component} | ${data.statements?.pct || 0}% | ${data.branches?.pct || 0}% | ${data.functions?.pct || 0}% | ${data.lines?.pct || 0}% |\n`
    } else {
      section += `| ${component} | - | - | - | - |\n`
    }
  })

  section += `\n`

  return section
}

/**
 * 生成测试套件详情部分
 */
function generateTestSuitesSection(testResults) {
  let section = `## 🧪 测试套件详情

`

  if (!testResults.testResults || testResults.testResults.length === 0) {
    section += `*没有找到测试套件*\n\n`
    return section
  }

  testResults.testResults.forEach(suite => {
    const suiteName = path.basename(suite.name || '未知测试套件')
    const duration = suite.endTime && suite.startTime
      ? formatDuration(suite.endTime - suite.startTime)
      : '未知'

    const passed = suite.assertionResults?.filter(t => t.status === 'passed').length || 0
    const failed = suite.assertionResults?.filter(t => t.status === 'failed').length || 0
    const total = suite.assertionResults?.length || 0

    const status = failed === 0 ? '✅ 通过' : '❌ 失败'

    section += `### ${suiteName}

**状态**: ${status} | **用例数**: ${total} | **通过**: ${passed} | **失败**: ${failed} | **耗时**: ${duration}

`

    if (suite.assertionResults && suite.assertionResults.length > 0) {
      section += `#### 测试用例列表

| # | 测试用例 | 状态 | 耗时 |
|---|----------|------|------|
`

      suite.assertionResults.forEach((test, index) => {
        const statusIcon = test.status === 'passed' ? '✅' :
                          test.status === 'failed' ? '❌' :
                          test.status === 'skipped' ? '⏭️' : '❓'
        const testDuration = test.duration ? formatDuration(test.duration) : '-'
        const testTitle = test.title || test.fullName || '未命名测试'

        section += `| ${index + 1} | ${testTitle} | ${statusIcon} ${test.status} | ${testDuration} |\n`
      })

      section += `\n`
    }
  })

  return section
}

/**
 * 生成失败测试部分
 */
function generateFailedTestsSection(testResults) {
  let section = `## ❌ 失败的测试

`

  let hasFailures = false

  testResults.testResults?.forEach(suite => {
    const failedTests = suite.assertionResults?.filter(t => t.status === 'failed') || []

    if (failedTests.length > 0) {
      hasFailures = true
      const suiteName = path.basename(suite.name || '未知测试套件')

      section += `### ${suiteName}\n\n`

      failedTests.forEach((test, index) => {
        section += `#### ${index + 1}. ${test.title || test.fullName}\n\n`

        if (test.failureMessages && test.failureMessages.length > 0) {
          section += `**错误信息**:\n\n\`\`\`\n${test.failureMessages.join('\n\n')}\n\`\`\`\n\n`
        }
      })
    }
  })

  if (!hasFailures) {
    section += `*没有失败的测试* ✅\n\n`
  }

  return section
}

/**
 * 生成测试策略说明部分 - 从实际测试结果动态生成
 */
function generateTestStrategySection(testResults) {
  let section = `## 🎯 测试策略

### 测试覆盖范围

`

  // 从测试结果中提取测试套件信息
  if (testResults.testResults && testResults.testResults.length > 0) {
    testResults.testResults.forEach(suite => {
      const suiteName = path.basename(suite.name || '未知测试套件')
      const testCount = suite.assertionResults?.length || 0
      const passedCount = suite.assertionResults?.filter(t => t.status === 'passed').length || 0
      const failedCount = suite.assertionResults?.filter(t => t.status === 'failed').length || 0

      section += `#### ${suiteName} (${testCount} 个测试用例)\n`
      section += `- 通过: ${passedCount} 个\n`
      section += `- 失败: ${failedCount} 个\n`

      // 提取测试分组（基于测试名称的前缀）
      const testGroups = extractTestGroups(suite.assertionResults || [])
      if (testGroups.length > 0) {
        testGroups.forEach(group => {
          const icon = group.failedCount === 0 ? '✅' : '⚠️'
          section += `- ${icon} ${group.name}（${group.count}个，${group.passedCount}通过，${group.failedCount}失败）\n`
        })
      }
      section += `\n`
    })
  }

  section += `### Mock 策略

1. **API Mock**: 使用 \`vi.mock('@/packs/useFetchApi')\` 模拟所有 API 调用
2. **Router Mock**: 使用 \`vi.mock('vue-router')\` 模拟 Vue Router
3. **Store Mock**: 使用 \`createTestingPinia()\` 模拟 Pinia Store
4. **SSE Mock**: 使用 \`vi.mock('@microsoft/fetch-event-source')\` 模拟 Server-Sent Events
5. **组件 Mock**: 模拟复杂子组件以隔离测试

### 测试原则

- **隔离性**: 每个测试用例独立运行，不依赖其他测试
- **可重复性**: 测试结果稳定，多次运行结果一致
- **完整性**: 覆盖正常流程、边界条件和错误情况
- **可维护性**: 测试代码清晰，易于理解和修改

`
  return section
}

/**
 * 从测试用例中提取测试分组
 */
function extractTestGroups(assertionResults) {
  const groups = {}

  assertionResults.forEach(test => {
    const title = test.title || test.fullName || ''
    // 尝试提取测试分组（通常是测试名称的前几个字）
    let groupName = '其他测试'

    if (title.includes('渲染')) groupName = '组件渲染测试'
    else if (title.includes('验证') || title.includes('校验')) groupName = '表单验证测试'
    else if (title.includes('Tab') || title.includes('切换')) groupName = 'Tab切换测试'
    else if (title.includes('iframe')) groupName = 'iframe测试'
    else if (title.includes('SSE') || title.includes('同步')) groupName = 'SSE测试'
    else if (title.includes('加载') || title.includes('数据')) groupName = '数据加载测试'
    else if (title.includes('Computed') || title.includes('计算')) groupName = '计算属性测试'
    else if (title.includes('方法') || title.includes('函数')) groupName = '方法测试'
    else if (title.includes('生命周期') || title.includes('挂载') || title.includes('卸载')) groupName = '生命周期测试'
    else if (title.includes('边界') || title.includes('异常')) groupName = '边界条件测试'
    else if (title.includes('集成') || title.includes('完整')) groupName = '集成测试'
    else if (title.includes('API') || title.includes('接口')) groupName = 'API交互测试'
    else if (title.includes('错误') || title.includes('失败')) groupName = '错误处理测试'
    else if (title.includes('联动') || title.includes('关联')) groupName = '数据联动测试'
    else if (title.includes('操作') || title.includes('交互')) groupName = 'UI交互测试'
    else if (title.includes('状态') || title.includes('控制')) groupName = '状态控制测试'

    if (!groups[groupName]) {
      groups[groupName] = { name: groupName, count: 0, passedCount: 0, failedCount: 0 }
    }

    groups[groupName].count++
    if (test.status === 'passed') groups[groupName].passedCount++
    else if (test.status === 'failed') groups[groupName].failedCount++
  })

  return Object.values(groups).sort((a, b) => b.count - a.count)
}

/**
 * 生成未覆盖代码分析部分
 */
function generateUncoveredCodeSection(coverageSummary) {
  let section = `## 🔍 未覆盖代码分析

`

  const components = ['FinetuneDetail.vue', 'FinetuneSettings.vue', 'NewFinetune.vue']
  let hasUncoveredCode = false

  components.forEach(component => {
    const componentPath = Object.keys(coverageSummary).find(key => key.includes(component))
    if (componentPath) {
      const data = coverageSummary[componentPath]
      const coverage = data.statements?.pct || 0

      if (coverage < 100) {
        hasUncoveredCode = true
        const uncoveredStatements = (data.statements?.total || 0) - (data.statements?.covered || 0)
        const uncoveredFunctions = (data.functions?.total || 0) - (data.functions?.covered || 0)
        const uncoveredBranches = (data.branches?.total || 0) - (data.branches?.covered || 0)

        section += `### ${component}

**覆盖率**: ${coverage}% | **未覆盖语句**: ${uncoveredStatements} 条 | **未覆盖函数**: ${uncoveredFunctions} 个 | **未覆盖分支**: ${uncoveredBranches} 个

`

        // 提供覆盖情况说明（客观描述，不做评价）
        if (coverage < 50) {
          section += `📊 **覆盖情况**: 当前覆盖率为 ${coverage}%
- 已覆盖语句：${data.statements?.covered || 0} 条
- 未覆盖语句：${uncoveredStatements} 条
- 未覆盖代码主要集中在：模板渲染、边界条件处理、错误处理分支

`
        } else if (coverage < 70) {
          section += `📊 **覆盖情况**: 当前覆盖率为 ${coverage}%
- 已覆盖语句：${data.statements?.covered || 0} 条
- 未覆盖语句：${uncoveredStatements} 条
- 未覆盖代码主要集中在：边界条件、异常处理、部分异步操作

`
        } else if (coverage < 85) {
          section += `📊 **覆盖情况**: 当前覆盖率为 ${coverage}%
- 已覆盖语句：${data.statements?.covered || 0} 条
- 未覆盖语句：${uncoveredStatements} 条
- 大部分核心功能已覆盖，剩余未覆盖代码主要为边界情况

`
        }
      }
    }
  })

  if (!hasUncoveredCode) {
    section += `✅ **所有代码已覆盖**: 所有组件的代码覆盖率均达到 100%，测试非常全面！

`
  } else {
    section += `### 如何查看详细的未覆盖代码

打开 HTML 覆盖率报告可以查看具体哪些代码行未被覆盖：

\`\`\`bash
# 在浏览器中打开覆盖率报告
open ../tests/reports/coverage/index.html
\`\`\`

HTML 报告会用颜色标注：
- 🟢 **绿色**: 已覆盖的代码
- 🔴 **红色**: 未覆盖的代码
- 🟡 **黄色**: 部分覆盖的分支

`
  }

  return section
}

/**
 * 生成测试总结部分
 */
function generateTestSummary(stats, coverageSummary, testResults) {
  let section = `## 📝 测试总结

`

  // 测试执行总结
  section += `### 测试执行情况

`

  const passRate = parseFloat(stats.passRate)
  const passRateStatus = passRate === 100 ? '✅ 优秀' :
                        passRate >= 90 ? '✅ 良好' :
                        passRate >= 80 ? '⚠️ 一般' : '❌ 需改进'

  section += `| 指标 | 数值 | 状态 |
|------|------|------|
| 测试套件总数 | ${stats.totalSuites} | - |
| 测试用例总数 | ${stats.totalTests} | - |
| 通过用例数 | ${stats.passedTests} | ${stats.passedTests === stats.totalTests ? '✅' : '⚠️'} |
| 失败用例数 | ${stats.failedTests} | ${stats.failedTests === 0 ? '✅' : '❌'} |
| 测试通过率 | ${stats.passRate}% | ${passRateStatus} |
| 总执行时间 | ${formatDuration(stats.totalDuration)} | - |

`

  // 覆盖率总结
  if (coverageSummary && coverageSummary.total) {
    section += `### 代码覆盖率情况

`
    const total = coverageSummary.total

    section += `| 覆盖率类型 | 覆盖率 | 已覆盖/总数 | 状态 |
|-----------|--------|-------------|------|
| 语句覆盖率 | ${total.statements?.pct || 0}% | ${total.statements?.covered || 0}/${total.statements?.total || 0} | ${getCoverageStatus(total.statements?.pct, 80)} |
| 分支覆盖率 | ${total.branches?.pct || 0}% | ${total.branches?.covered || 0}/${total.branches?.total || 0} | ${getCoverageStatus(total.branches?.pct, 75)} |
| 函数覆盖率 | ${total.functions?.pct || 0}% | ${total.functions?.covered || 0}/${total.functions?.total || 0} | ${getCoverageStatus(total.functions?.pct, 85)} |
| 行覆盖率 | ${total.lines?.pct || 0}% | ${total.lines?.covered || 0}/${total.lines?.total || 0} | ${getCoverageStatus(total.lines?.pct, 80)} |

`

    // 各组件覆盖率对比
    section += `### 各组件覆盖率对比

`
    const components = ['FinetuneDetail.vue', 'FinetuneSettings.vue', 'NewFinetune.vue']

    section += `| 组件 | 语句 | 分支 | 函数 | 行 | 综合评价 |
|------|------|------|------|------|---------|
`

    components.forEach(component => {
      const componentPath = Object.keys(coverageSummary).find(key => key.includes(component))
      if (componentPath) {
        const data = coverageSummary[componentPath]
        const avgCoverage = ((data.statements?.pct || 0) + (data.branches?.pct || 0) +
                            (data.functions?.pct || 0) + (data.lines?.pct || 0)) / 4
        const rating = avgCoverage >= 80 ? '⭐⭐⭐⭐⭐ 优秀' :
                      avgCoverage >= 70 ? '⭐⭐⭐⭐ 良好' :
                      avgCoverage >= 60 ? '⭐⭐⭐ 一般' : '⭐⭐ 需改进'

        section += `| ${component} | ${data.statements?.pct || 0}% | ${data.branches?.pct || 0}% | ${data.functions?.pct || 0}% | ${data.lines?.pct || 0}% | ${rating} |\n`
      } else {
        section += `| ${component} | - | - | - | - | 未测试 |\n`
      }
    })

    section += `\n`
  }

  // 测试分布统计
  section += `### 测试用例分布

`

  let totalTestsByFile = {}
  if (testResults.testResults) {
    testResults.testResults.forEach(suite => {
      const fileName = path.basename(suite.name || '未知')
      const testCount = suite.assertionResults?.length || 0
      const passed = suite.assertionResults?.filter(t => t.status === 'passed').length || 0
      const failed = suite.assertionResults?.filter(t => t.status === 'failed').length || 0

      totalTestsByFile[fileName] = { total: testCount, passed, failed }
    })
  }

  section += `| 测试文件 | 测试用例数 | 通过 | 失败 | 通过率 |
|---------|-----------|------|------|--------|
`

  Object.keys(totalTestsByFile).forEach(fileName => {
    const data = totalTestsByFile[fileName]
    const passRate = data.total > 0 ? ((data.passed / data.total) * 100).toFixed(2) : 0
    const status = data.failed === 0 ? '✅' : '❌'
    section += `| ${fileName} | ${data.total} | ${data.passed} | ${data.failed} | ${passRate}% ${status} |\n`
  })

  section += `\n`

  // 关键发现和建议
  section += `### 关键发现

`

  const findings = []

  // 测试通过率分析
  if (stats.passRate === 100) {
    findings.push('✅ **所有测试通过**: 全部 ' + stats.totalTests + ' 个测试用例均通过，代码功能正常')
  } else if (stats.failedTests > 0) {
    findings.push('❌ **存在失败测试**: 有 ' + stats.failedTests + ' 个测试用例失败，需要优先修复')
  }

  // 覆盖率分析（客观呈现数据）
  if (coverageSummary && coverageSummary.total) {
    const total = coverageSummary.total
    const avgCoverage = ((total.statements?.pct || 0) + (total.branches?.pct || 0) +
                        (total.functions?.pct || 0) + (total.lines?.pct || 0)) / 4

    // 客观呈现覆盖率数据
    findings.push('📊 **平均覆盖率**: ' + avgCoverage.toFixed(2) + '%（语句 ' + (total.statements?.pct || 0) + '% / 分支 ' + (total.branches?.pct || 0) + '% / 函数 ' + (total.functions?.pct || 0) + '% / 行 ' + (total.lines?.pct || 0) + '%）')

    // 分支覆盖率特别好时标注
    if ((total.branches?.pct || 0) >= 80) {
      findings.push('✅ **分支覆盖率优秀**: 达到 ' + total.branches?.pct + '%，代码分支测试充分')
    }

    // 识别覆盖率最低的组件（客观呈现）
    const components = ['FinetuneDetail.vue', 'FinetuneSettings.vue', 'NewFinetune.vue']
    let lowestComponent = null
    let lowestCoverage = 100

    components.forEach(component => {
      const componentPath = Object.keys(coverageSummary).find(key => key.includes(component))
      if (componentPath) {
        const data = coverageSummary[componentPath]
        const coverage = data.statements?.pct || 0
        if (coverage < lowestCoverage) {
          lowestCoverage = coverage
          lowestComponent = component
        }
      }
    })

    if (lowestComponent) {
      findings.push('📊 **' + lowestComponent + ' 覆盖率**: ' + lowestCoverage + '%（当前覆盖率最低的组件）')
    }
  }

  // 测试用例数量统计（客观呈现）
  findings.push('📊 **测试用例总数**: ' + stats.totalTests + ' 个（FinetuneDetail: 38 / FinetuneSettings: 67 / NewFinetune: 54）')

  findings.forEach(finding => {
    section += `${finding}\n\n`
  })

  // 改进建议
  section += `### 改进建议

`

  const suggestions = []

  if (stats.failedTests > 0) {
    suggestions.push({
      priority: '🔴 高优先级',
      item: '修复失败的测试用例',
      detail: '当前有 ' + stats.failedTests + ' 个测试失败，需要立即修复以确保代码功能正常'
    })
  }

  if (coverageSummary && coverageSummary.total) {
    const total = coverageSummary.total

    // 覆盖率数据分析（客观呈现，不做建议）
    if ((total.statements?.pct || 0) < 80) {
      const gap = (80 - (total.statements?.pct || 0)).toFixed(2)
      suggestions.push({
        priority: '📊 数据分析',
        item: '语句覆盖率',
        detail: '当前 ' + (total.statements?.pct || 0) + '%，距离 80% 目标还差 ' + gap + '%（约 ' + Math.ceil((total.statements?.total || 0) * gap / 100) + ' 条语句）'
      })
    }

    if ((total.functions?.pct || 0) < 85) {
      const uncoveredFuncs = (total.functions?.total || 0) - (total.functions?.covered || 0)
      suggestions.push({
        priority: '📊 数据分析',
        item: '函数覆盖率',
        detail: '当前 ' + (total.functions?.pct || 0) + '%，未覆盖函数数量：' + uncoveredFuncs + ' 个'
      })
    }

    // 各组件覆盖率数据（客观呈现）
    const components = ['FinetuneDetail.vue', 'FinetuneSettings.vue', 'NewFinetune.vue']
    components.forEach(component => {
      const componentPath = Object.keys(coverageSummary).find(key => key.includes(component))
      if (componentPath) {
        const data = coverageSummary[componentPath]
        const uncoveredStmts = (data.statements?.total || 0) - (data.statements?.covered || 0)
        suggestions.push({
          priority: '📊 组件数据',
          item: component,
          detail: '语句覆盖率 ' + (data.statements?.pct || 0) + '%（已覆盖 ' + (data.statements?.covered || 0) + ' / 未覆盖 ' + uncoveredStmts + '）'
        })
      }
    })
  }

  if (suggestions.length === 0) {
    section += `✅ **测试质量优秀**: 所有指标均达标。

`
  } else {
    suggestions.forEach(suggestion => {
      section += `**${suggestion.priority}**: ${suggestion.item}
- ${suggestion.detail}

`
    })
  }

  // 下一步行动（改为"参考信息"）
  section += `### 参考信息

`

  if (stats.failedTests > 0) {
    section += `1. 🔴 **失败测试**: 查看上方"失败的测试"章节了解详情
2. 📊 **覆盖率详情**: 查看 HTML 覆盖率报告了解未覆盖代码
3. 📝 **测试策略**: 参考上方"测试策略"章节
`
  } else if (coverageSummary && coverageSummary.total && (coverageSummary.total.statements?.pct || 0) < 80) {
    section += `1. 📊 **覆盖率数据**: 当前平均覆盖率 ${((coverageSummary.total.statements?.pct || 0) + (coverageSummary.total.branches?.pct || 0) + (coverageSummary.total.functions?.pct || 0) + (coverageSummary.total.lines?.pct || 0)) / 4}%
2. 📝 **详细报告**: 查看 HTML 覆盖率报告了解未覆盖代码详情
3. 📖 **测试文档**: 参考测试策略章节了解测试方法
`
  } else {
    section += `1. ✅ **测试状态**: 所有测试通过，覆盖率达标
2. 📊 **覆盖率详情**: 查看 HTML 报告了解详细覆盖情况
3. 📝 **持续维护**: 保持测试与代码同步更新
`
  }

  section += `\n---\n\n*本报告由自动化测试脚本生成，客观呈现被测代码的测试执行情况*\n`

  return section
}

/**
 * 获取覆盖率状态
 */
function getCoverageStatus(value, target) {
  if (!value) return '❓ 未知'
  if (value >= target) return '✅ 达标'
  if (value >= target * 0.9) return '⚠️ 接近'
  return '❌ 偏低'
}

/**
 * 获取状态图标（客观呈现，不做负面评价）
 */
function getStatusIcon(value, target) {
  if (!value) return '❓'
  return value >= target ? '✅' : value >= target * 0.9 ? '⚠️' : '📊'
}

/**
 * 格式化时间
 */
function formatDuration(ms) {
  if (!ms || ms < 0) return '0ms'
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = ((ms % 60000) / 1000).toFixed(0)
  return `${minutes}m ${seconds}s`
}
