// 卡牌颜色枚举
export enum CardColor {
  RED = 'Red',
  GREEN = 'Green',
  BLUE = 'Blue',
  PURPLE = 'Purple',
  COLORLESS = 'Colorless',
  STATUS = 'Status',
  CURSE = 'Curse',
}

// 卡牌类型枚举
export enum CardType {
  ATTACK = 'Attack',
  SKILL = 'Skill',
  POWER = 'Power',
}

// 卡牌稀有度枚举
export enum CardRarity {
  COMMON = 'Common',
  UNCOMMON = 'Uncommon',
  RARE = 'Rare',
}

// 描述文字片段的颜色类型
// 0 - normal (白色), 1 - keyword (黄色), 2 - value (绿色), 3 - energy-gem 图标
export type TextSegmentColor = 0 | 1 | 2 | 3

// 描述文字的单个片段
export interface TextSegment {
  char: string
  colored: TextSegmentColor // 0=normal, 1=yellow(keyword), 2=green(value), 3=energy-gem(@)
}

// 描述的一行
export interface DescriptionRow {
  chars: TextSegment[]
  string: string // 拼接后的纯文本（不含标记符）
  len: number // 文本宽度（像素）
}

// 自定义卡图配置
export interface CardArtConfig {
  imagePath: string // uni.chooseImage 返回的临时路径
  x: number // 水平偏移
  y: number // 垂直偏移
  width: number // 显示宽度
  height: number // 显示高度
}

// 完整的卡牌数据
export interface CardData {
  color: CardColor
  type: CardType
  rarity: CardRarity
  name: string
  nameUpgraded: boolean
  energyCost: string // '0'-'9' | 'X' | ''
  energyUpgraded: boolean
  descriptionRows: string[] // 原始输入文本，最大5行
  cardArt: CardArtConfig | null
}

// 用户登录信息
export interface UserInfo {
  nickName: string
  avatarUrl: string
}

// 解析后的卡牌素材路径
export interface CardAssets {
  background: string
  frame: string
  manaIcon: string
  manaGem: string // 用于描述中的 @ 替换
}
