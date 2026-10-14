import { CardColor, CardType, CardRarity, type CardArtConfig } from '@/types/card'

// ========== 卡牌尺寸 ==========
// 逻辑画布尺寸（与参考项目 pg 一致）
export const CARD_WIDTH = 350
export const CARD_HEIGHT = 455

// 卡图裁剪区域（在 350×455 坐标系中的位置和大小）
export const ART_CLIP_SIZE = { x: 30, y: 40, w: 300, h: 300 }

// ========== 文本限制 ==========
export const MAX_NAME_LENGTH = 18
export const MAX_DESCRIPTION_ROWS = 5
export const MAX_CHARS_PER_ROW = 30

// ========== 能量费用选项 ==========
export const ENERGY_VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'X'] as const

// ========== 能量数字位置微调（来自参考项目） ==========
// 每个字符在能量宝石上的 X/Y 偏移
export const ENERGY_OFFSETS: Record<string, { x: number; y: number }> = {
  '0': { x: 4.0, y: 0 },
  '1': { x: 0, y: 0 },
  '2': { x: 3, y: 1 },
  '3': { x: 2, y: 0 },
  '4': { x: 4, y: 1 },
  '5': { x: 2, y: 0 },
  '6': { x: 3.5, y: 0 },
  '7': { x: 0, y: 0 },
  '8': { x: 3.5, y: 1 },
  '9': { x: 2, y: 0 },
  'X': { x: 3.5, y: 0 },
}

// ========== 默认卡图位置与大小（来自参考项目 resetArt） ==========
export const DEFAULT_ART_CONFIG: CardArtConfig = {
  imagePath: '',
  x: 69,
  y: 140,
  width: 265,
  height: 200,
}

// 卡图滑块范围（来自参考项目）
export const ART_SLIDER_RANGES = {
  x: { min: -175, max: 380 },
  y: { min: -100, max: 350 },
  width: { min: 1, max: 500 },
  height: { min: 1, max: 600 },
}

// ========== 颜色/类型/稀有度标签 ==========
export const COLOR_LABELS: Record<CardColor, string> = {
  [CardColor.RED]: 'Red (Ironclad)',
  [CardColor.GREEN]: 'Green (Silent)',
  [CardColor.BLUE]: 'Blue (Defect)',
  [CardColor.PURPLE]: 'Purple (Watcher)',
  [CardColor.COLORLESS]: 'Colorless',
  [CardColor.STATUS]: 'Status',
  [CardColor.CURSE]: 'Curse',
}

export const TYPE_LABELS: Record<CardType, string> = {
  [CardType.ATTACK]: 'Attack',
  [CardType.SKILL]: 'Skill',
  [CardType.POWER]: 'Power',
}

export const RARITY_LABELS: Record<CardRarity, string> = {
  [CardRarity.COMMON]: 'Common',
  [CardRarity.UNCOMMON]: 'Uncommon',
  [CardRarity.RARE]: 'Rare',
}

// ========== 下拉选项数组（用于 wd-picker columns） ==========
export const COLOR_OPTIONS = Object.entries(COLOR_LABELS).map(([value, label]) => ({
  label,
  value,
}))

export const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({
  label,
  value,
}))

export const RARITY_OPTIONS = Object.entries(RARITY_LABELS).map(([value, label]) => ({
  label,
  value,
}))

// ========== 默认卡牌数据 ==========
export function createDefaultCardData() {
  return {
    color: CardColor.RED,
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    name: 'Card',
    nameUpgraded: false,
    energyCost: '1',
    energyUpgraded: false,
    descriptionRows: ['Card >Text< @'],
    cardArt: null,
  }
}
