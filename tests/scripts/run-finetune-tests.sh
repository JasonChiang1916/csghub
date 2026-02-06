#!/bin/bash
# Finetune 组件测试运行脚本
# 使用方法：./run-finetune-tests.sh [选项]
# 选项：
#   all - 运行所有测试（默认）
#   new - 只运行 NewFinetune 测试
#   settings - 只运行 FinetuneSettings 测试
#   detail - 只运行 FinetuneDetail 测试
#   coverage - 运行所有测试并生成覆盖率报告

set -e

echo "=========================================="
echo "  Finetune 组件单元测试"
echo "=========================================="
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在 csghub/frontend 目录下运行此脚本"
    exit 1
fi

# 创建测试结果目录
mkdir -p ../tests/reports
mkdir -p ../tests/reports/coverage

# 获取选项参数
OPTION=${1:-all}

case $OPTION in
    new)
        echo "🧪 运行 NewFinetune 组件测试..."
        npm test -- --run src/components/finetune/__tests__/NewFinetune.spec.js
        ;;
    settings)
        echo "🧪 运行 FinetuneSettings 组件测试..."
        npm test -- --run src/components/finetune/__tests__/FinetuneSettings.spec.js
        ;;
    detail)
        echo "🧪 运行 FinetuneDetail 组件测试..."
        npm test -- --run src/components/finetune/__tests__/FinetuneDetail.spec.js
        ;;
    coverage)
        echo "🧪 运行所有测试并生成覆盖率报告..."

        # 运行测试并捕获退出码
        if npm run coverage -- --run src/components/finetune/__tests__/; then
            echo ""
            echo "✅ 所有测试通过"
            TEST_STATUS="success"
        else
            echo ""
            echo "⚠️  部分测试失败，但将继续生成报告"
            TEST_STATUS="failed"
        fi

        echo ""
        echo "🧪 生成测试报告..."
        if node ../tests/scripts/generate-test-report.js; then
            echo "✅ 报告生成成功"
        else
            echo "❌ 报告生成失败，请检查测试结果文件"
            exit 1
        fi

        echo ""
        echo "📊 查看报告："
        echo "   - Markdown 报告: ../tests/reports/FINETUNE-TEST-REPORT.md"
        echo "   - 覆盖率报告 (HTML): ../tests/reports/coverage/index.html"
        echo ""
        echo "💡 提示：在浏览器中打开覆盖率报告："
        echo "   open ../tests/reports/coverage/index.html"

        if [ "$TEST_STATUS" = "failed" ]; then
            echo ""
            echo "⚠️  警告：存在失败的测试，请查看报告详情"
            exit 1
        fi

        echo ""
        echo "✅ 测试执行完成！"
        ;;
    all|*)
        echo "🧪 运行所有 Finetune 组件测试..."
        npm test -- --run src/components/finetune/__tests__/
        ;;
esac

echo ""
echo "=========================================="
echo "  测试执行完成"
echo "=========================================="
