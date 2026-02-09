#!/bin/bash

# 并行唤醒 5 轮 - 并发度 20

echo "🚀 开始 5 轮并行唤醒"
echo "并发度: 20"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

for i in {1..5}; do
  echo ""
  echo "========================================"
  echo "📍 第 $i 轮"
  echo "========================================"
  echo ""

  npx tsx scripts/wake-ocs-parallel.ts --concurrency 20

  EXIT_CODE=$?

  echo ""
  echo "第 $i 轮完成"

  if [ $EXIT_CODE -ne 0 ]; then
    echo "❌ 第 $i 轮失败，退出码: $EXIT_CODE"
    exit $EXIT_CODE
  fi

  echo ""
  echo "⏸️  等待 3 秒后继续..."
  sleep 3
done

echo ""
echo "========================================"
echo "✅ 5 轮全部完成！"
echo "========================================"
echo "结束时间: $(date '+%Y-%m-%d %H:%M:%S')"
