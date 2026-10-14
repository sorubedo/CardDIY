import { CardColor, CardType, CardRarity, type CardAssets } from '@/types/card'

// 素材基础路径
const ASSETS_BASE = '/static/card-assets'

// 辅助函数：构建资源路径
function assetPath(category: string, filename: string): string {
  return `${ASSETS_BASE}/${category}/${filename}`
}

/**
 * 根据卡牌颜色、类型、稀有度解析对应的素材路径
 *
 * 逻辑完全来自参考项目 changeCardFrame() 函数
 * 特殊规则：
 *   - Common + Power → RarePowerFrame（不存在 CommonPowerFrame）
 *   - Colorless 的 ManaGem → RedManaGem
 *   - Status 的 ManaGem → RedManaGem
 *   - Curse 的 ManaGem → RedManaGem
 *   - Status → 使用 ColorlessSkillBackground + CommonSkillFrame
 *   - Curse → 使用 CurseBackground + CommonSkillFrame
 */
export function resolveCardAssets(
  color: CardColor,
  type: CardType,
  rarity: CardRarity,
): CardAssets {
  let background: string
  let frame: string
  let manaIcon: string
  let manaGem: string

  if (color === CardColor.STATUS) {
    // Status 固定使用 Colorless 背景和 Common 边框
    background = assetPath('backgrounds', 'ColorlessSkillBackground.png')
    frame = assetPath('frames', 'CommonSkillFrame.png')
    manaIcon = assetPath('gems', 'ColorlessMana.png')
    manaGem = assetPath('gems', 'RedManaGem.png') // Status 使用 RedManaGem
  } else if (color === CardColor.CURSE) {
    // Curse 使用专门的诅咒背景
    background = assetPath('backgrounds', 'CurseBackground.png')
    frame = assetPath('frames', 'CommonSkillFrame.png')
    manaIcon = assetPath('gems', 'ColorlessMana.png')
    manaGem = assetPath('gems', 'RedManaGem.png') // Curse 使用 RedManaGem
  } else {
    // 正常颜色：Red/Green/Blue/Purple/Colorless
    background = assetPath('backgrounds', `${color}${type}Background.png`)
    manaIcon = assetPath('gems', `${color}Mana.png`)

    // 边框：Common Power 使用 RarePowerFrame（不存在 CommonPowerFrame）
    if (rarity === CardRarity.COMMON && type === CardType.POWER) {
      frame = assetPath('frames', `RarePowerFrame.png`)
    } else {
      frame = assetPath('frames', `${rarity}${type}Frame.png`)
    }

    // 宝石：Colorless 使用 RedManaGem
    if (color === CardColor.COLORLESS) {
      manaGem = assetPath('gems', 'RedManaGem.png')
    } else {
      manaGem = assetPath('gems', `${color}ManaGem.png`)
    }
  }

  return { background, frame, manaIcon, manaGem }
}

/**
 * 判断是否显示能量宝石和能量数字
 * Curse 永远不显示，Status 由额外开关控制
 */
export function shouldShowEnergy(color: CardColor, showStatusEnergy: boolean): boolean {
  if (color === CardColor.CURSE) return false
  if (color === CardColor.STATUS) return showStatusEnergy
  return true
}

/**
 * 判断是否显示类型和稀有度选择器
 * Status 和 Curse 下隐藏
 */
export function shouldShowTypeAndRarity(color: CardColor): boolean {
  return color !== CardColor.STATUS && color !== CardColor.CURSE
}
