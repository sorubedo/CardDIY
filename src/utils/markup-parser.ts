import type { TextSegment, DescriptionRow } from '@/types/card'

/**
 * 解析描述文本中的颜色标记语法（来自参考项目 call() 函数）
 *
 * 标记规则：
 *   >keyword<  → 黄色 (colored: 1)
 *   #value#    → 绿色 (colored: 2)
 *   @          → 能量宝石图标 (colored: 3)
 *   其他文字     → 白色 (colored: 0)
 *
 * 状态机：扫描每个字符，跟踪当前颜色模式
 */
export function parseMarkup(input: string): TextSegment[] {
  const chars: TextSegment[] = []

  // 如果输入为空，返回空数组
  if (!input) return chars

  let colored: 0 | 1 | 2 = 0

  for (let i = 0; i < input.length; i++) {
    const curr = input.substring(i, i + 1)

    if (colored === 0 && curr === '>') {
      // 进入关键字模式（黄色）
      colored = 1
    } else if (colored === 1 && curr === '<') {
      // 退出关键字模式
      colored = 0
    } else if (curr === '#') {
      // 切换绿色模式
      if (colored === 0) {
        colored = 2
      } else if (colored === 2) {
        colored = 0
      }
    } else if (curr === '@') {
      // 能量宝石占位符
      chars.push({ char: curr, colored: 3 })
    } else {
      // 普通字符，使用当前颜色
      chars.push({ char: curr, colored })
    }
  }

  return chars
}

/**
 * 将原始输入文本数组解析为 DescriptionRow 数组
 * 需要传入 textWidth 函数用于计算文本宽度（平台相关）
 */
export function parseDescriptionRows(
  inputRows: string[],
  textWidthFn: (text: string) => number,
): DescriptionRow[] {
  return inputRows.map((input) => {
    const chars = parseMarkup(input)
    const string = chars.map((c) => c.char).join('')
    const len = textWidthFn(string)
    return { chars, string, len }
  })
}
