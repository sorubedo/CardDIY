import { reactive, computed, ref, watch } from 'vue'
import {
  CardColor,
  CardType,
  CardRarity,
  type CardData,
  type CardArtConfig,
  type DescriptionRow,
} from '@/types/card'
import {
  createDefaultCardData,
  MAX_DESCRIPTION_ROWS,
  DEFAULT_ART_CONFIG,
} from '@/constants/card-constants'
import { resolveCardAssets, shouldShowEnergy, shouldShowTypeAndRarity } from '@/utils/asset-resolver'
import { parseMarkup } from '@/utils/markup-parser'

/**
 * 核心卡牌数据状态管理
 *
 * 集中管理：
 *   - 卡牌属性（颜色/类型/稀有度/名称/能量/描述/卡图）
 *   - 计算属性（素材路径、解析后的描述、显示名称等）
 *   - 操作方法（增删描述行、设置卡图、重置等）
 */
export function useCardData() {
  const defaults = createDefaultCardData()

  // ========== 响应式状态 ==========
  const cardData = reactive<CardData>({
    color: defaults.color,
    type: defaults.type,
    rarity: defaults.rarity,
    name: defaults.name,
    nameUpgraded: defaults.nameUpgraded,
    energyCost: defaults.energyCost,
    energyUpgraded: defaults.energyUpgraded,
    descriptionRows: [...defaults.descriptionRows],
    cardArt: defaults.cardArt,
  })

  const numOfRows = ref(cardData.descriptionRows.length)
  const statusEnergy = ref(true) // Status 牌是否显示能量

  // ========== 计算属性 ==========

  // 素材路径
  const cardAssets = computed(() =>
    resolveCardAssets(cardData.color, cardData.type, cardData.rarity),
  )

  // 是否显示能量
  const showEnergy = computed(() => shouldShowEnergy(cardData.color, statusEnergy.value))

  // 是否显示类型/稀有度选择器
  const showTypeAndRarity = computed(() => shouldShowTypeAndRarity(cardData.color))

  // 显示用的卡名（含升级标记）
  const displayName = computed(() => {
    const name = cardData.name || ''
    return cardData.nameUpgraded ? name + '+' : name
  })

  // 解析后的描述行（含标记颜色信息）
  const parsedRows = computed<DescriptionRow[]>(() => {
    return cardData.descriptionRows.map((input) => {
      const chars = parseMarkup(input)
      const string = chars.map((c) => c.char).join('')
      return { chars, string, len: 0 } // len 在渲染时由 Canvas measureText 计算
    })
  })

  // 非空描述行
  const activeRows = computed(() =>
    parsedRows.value.filter((row) => row.string !== ''),
  )

  // ========== 操作方法 ==========

  // 颜色变化时的副作用（重置类型和稀有度为合理默认值）
  function onColorChange(newColor: string) {
    cardData.color = newColor as CardColor
    // Status 和 Curse 不需要类型和稀有度，但保持内部状态不变
    // changeCardFrame 逻辑在 asset-resolver 中处理
  }

  // 添加描述行
  function addDescriptionRow(): void {
    if (numOfRows.value < MAX_DESCRIPTION_ROWS) {
      numOfRows.value++
      if (cardData.descriptionRows.length < numOfRows.value) {
        cardData.descriptionRows.push('')
      }
    }
  }

  // 删除描述行
  function removeDescriptionRow(): void {
    if (numOfRows.value > 1) {
      cardData.descriptionRows.splice(numOfRows.value - 1, 1)
      numOfRows.value--
    }
  }

  // 更新某一行描述文本
  function updateDescriptionRow(index: number, value: string): void {
    if (index >= 0 && index < cardData.descriptionRows.length) {
      cardData.descriptionRows[index] = value
    }
  }

  // 设置卡图
  function setCardArt(imagePath: string): void {
    cardData.cardArt = {
      imagePath,
      x: DEFAULT_ART_CONFIG.x,
      y: DEFAULT_ART_CONFIG.y,
      width: DEFAULT_ART_CONFIG.width,
      height: DEFAULT_ART_CONFIG.height,
    }
  }

  // 移除卡图
  function removeCardArt(): void {
    cardData.cardArt = null
  }

  // 重置卡图位置
  function resetCardArtPosition(): void {
    if (cardData.cardArt) {
      cardData.cardArt.x = DEFAULT_ART_CONFIG.x
      cardData.cardArt.y = DEFAULT_ART_CONFIG.y
      cardData.cardArt.width = DEFAULT_ART_CONFIG.width
      cardData.cardArt.height = DEFAULT_ART_CONFIG.height
    }
  }

  // 更新卡图位置/大小
  function updateCardArtPosition(updates: Partial<Pick<CardArtConfig, 'x' | 'y' | 'width' | 'height'>>): void {
    if (cardData.cardArt) {
      Object.assign(cardData.cardArt, updates)
    }
  }

  // 重置整个卡牌
  function resetAll(): void {
    const d = createDefaultCardData()
    cardData.color = d.color
    cardData.type = d.type
    cardData.rarity = d.rarity
    cardData.name = d.name
    cardData.nameUpgraded = d.nameUpgraded
    cardData.energyCost = d.energyCost
    cardData.energyUpgraded = d.energyUpgraded
    cardData.descriptionRows = [...d.descriptionRows]
    cardData.cardArt = d.cardArt
    numOfRows.value = d.descriptionRows.length
    statusEnergy.value = true
  }

  return {
    // 状态
    cardData,
    numOfRows,
    statusEnergy,
    // 计算属性
    cardAssets,
    showEnergy,
    showTypeAndRarity,
    displayName,
    parsedRows,
    activeRows,
    // 方法
    onColorChange,
    addDescriptionRow,
    removeDescriptionRow,
    updateDescriptionRow,
    setCardArt,
    removeCardArt,
    resetCardArtPosition,
    updateCardArtPosition,
    resetAll,
  }
}
