import type { CardData, CardAssets, DescriptionRow } from '@/types/card'
import { CardColor, CardType, CardRarity } from '@/types/card'
import { CARD_WIDTH, CARD_HEIGHT, ENERGY_OFFSETS } from '@/constants/card-constants'
import { parseMarkup } from '@/utils/markup-parser'
import { shouldShowEnergy } from '@/utils/asset-resolver'

const C = {
  TYPE: '#5b5b5b',
  NAME_SHADOW_FILL: '#5f5e5c',
  NAME_SHADOW_STROKE: 'rgba(0,0,0,0.235)',
  NAME_FILL: '#fcf8ea',
  NAME_UPGRADED: '#85d628',
  NAME_STROKE: '#5b5651',
  ENERGY_FILL: '#f9f2e6',
  ENERGY_OUTER_STROKE: 'rgba(100,100,100,0.65)',
  ENERGY_INNER_STROKE: '#4b473a',
  DESC_SHADOW: '#342929',
  DESC_KEYWORD: '#e1c36c',
  DESC_VALUE: '#85d628',
  DESC_NORMAL: '#f9f2e6',
} as const

const ART_CLIP = { x: 30, y: 40, w: 300, h: 300 }

function loadImage(src: string, canvas: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (canvas.createImage) {
      const img = canvas.createImage()
      img.onload = () => resolve(img); img.onerror = reject; img.src = src
    } else {
      const img = new Image()
      img.onload = () => resolve(img); img.onerror = reject; img.src = src
    }
  })
}

export function useCardRenderer(canvasId: string) {
  let canvas: any = null
  let ctx: any = null

  // 防止并发渲染——async renderCard 中的 await 会让多个渲染重叠，
  // 共用同一个 ctx 导致 clip/transform 状态错乱
  let renderVersion = 0

  function init(canvasOrComponent: any): Promise<void> {
    // 多策略获取 canvas DOM 元素
    const resolveElement = (target: any): any => {
      if (target && typeof target.getContext === 'function') return target
      if (target?.$el) return resolveElement(target.$el)
      if (target?.querySelector) return target.querySelector(`#${canvasId}`)
      if (typeof document !== 'undefined') return document.getElementById(canvasId)
      return null
    }

    const el = resolveElement(canvasOrComponent)
    if (el && typeof el.getContext === 'function') {
      canvas = el
      ctx = canvas.getContext('2d')
      canvas.width = CARD_WIDTH
      canvas.height = CARD_HEIGHT
      return Promise.resolve()
    }

    // 小程序 fallback
    return new Promise((resolve, reject) => {
      uni.createSelectorQuery().in(canvasOrComponent)
        .select(`#${canvasId}`)
        .fields({ node: true, size: true })
        .exec((res: any) => {
          if (res?.[0]?.node) {
            canvas = res[0].node
            ctx = canvas.getContext('2d')
            canvas.width = CARD_WIDTH
            canvas.height = CARD_HEIGHT
            resolve()
          } else {
            reject(new Error('Canvas not found: ' + canvasId))
          }
        })
    })
  }

  async function renderCard(card: CardData, assets: CardAssets, locale?: string) {
    if (!ctx || !canvas) return

    // 每次调用递增版本号，绘制阶段校验——旧渲染直接丢弃
    const myVersion = ++renderVersion

    const showCost = shouldShowEnergy(card.color, true)

    const rows: DescriptionRow[] = card.descriptionRows
      .map(input => {
        const chars = parseMarkup(input)
        return { chars, string: chars.map(c => c.char).join(''), len: 0 }
      })
      .filter(row => row.string !== '')

    const bgImg = await loadImage(assets.background, canvas)
    const frameImg = await loadImage(assets.frame, canvas)
    const manaImg = showCost ? await loadImage(assets.manaIcon, canvas) : null
    const gemImg = await loadImage(assets.manaGem, canvas).catch(() => null)
    const artImg = card.cardArt ? await loadImage(card.cardArt.imagePath, canvas).catch(() => null) : null

    if (myVersion !== renderVersion) return

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    // 计算卡片框图片的视觉中心（去除左边能量标志所占空间）
    // 原始框图片约 664px 宽，可见区左边界 ≈16px，右边界 ≈662px，中心 ≈339px
    const frameScale = CARD_WIDTH / frameImg.width
    const frameLeftEdge = 16
    const frameRightEdge = frameImg.width - 1
    const typeCenterX = Math.round((frameLeftEdge + frameRightEdge) / 2 * frameScale)

    // 图层 0: 卡图遮罩
    if (artImg) {
      ctx.save(); ctx.beginPath()
      ctx.rect(ART_CLIP.x, ART_CLIP.y, ART_CLIP.w, ART_CLIP.h); ctx.clip()
      ctx.drawImage(artImg, card.cardArt!.x - 20, card.cardArt!.y - 80, card.cardArt!.width, card.cardArt!.height)
      ctx.restore()
    }

    ctx.drawImage(bgImg, 0, 0, 350, bgImg.height * (350 / bgImg.width))
    ctx.drawImage(frameImg, 0, 0, 350, frameImg.height * (350 / frameImg.width))

    if (manaImg) ctx.drawImage(manaImg, -5, -5, 350, manaImg.height * (350 / manaImg.width))

    // 图层 4: 类型标签
    ctx.font = 'bold 17px Kreon, serif'; ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = C.TYPE; ctx.strokeStyle = C.TYPE; ctx.lineWidth = 0.4
     const isZh = locale === 'zh-CN'
     let typeText: string
     if (card.color === CardColor.STATUS)      { typeText = isZh ? '状态' : 'Status' }
     else if (card.color === CardColor.CURSE)  { typeText = isZh ? '诅咒' : 'Curse' }
     else if (card.type === CardType.ATTACK)   { typeText = isZh ? '攻击' : 'Attack' }
     else if (card.type === CardType.SKILL)    { typeText = isZh ? '技能' : 'Skill' }
     else                                      { typeText = isZh ? '能力' : 'Power' }
     // 居中在卡片框图片的视觉中心点，而不是画布全宽（左上角能量标志使全宽居中视觉偏左）
     ctx.textAlign = 'center'
     ctx.strokeText(typeText, typeCenterX, 262)
     ctx.fillText(typeText, typeCenterX, 261)
     ctx.textAlign = 'start'

    // 图层 5: 卡名
    const displayName = card.nameUpgraded ? card.name + '+' : card.name
    const nameChars = displayName.split('')
    ctx.font = '24px Kreon, serif'
    let nameWidth = 0
    for (const ch of nameChars) nameWidth += ctx.measureText(ch).width + 2
    ctx.fillStyle = C.NAME_SHADOW_FILL; ctx.strokeStyle = C.NAME_SHADOW_STROKE; ctx.lineWidth = 4
    let coeff = 0
    for (const ch of nameChars) { ctx.strokeText(ch, 182 - nameWidth / 2 + coeff, 69); coeff += ctx.measureText(ch).width + 2 }
    ctx.fillStyle = card.nameUpgraded ? C.NAME_UPGRADED : C.NAME_FILL
    ctx.strokeStyle = C.NAME_STROKE; ctx.lineWidth = 4
    coeff = 0
    for (const ch of nameChars) { ctx.strokeText(ch, 179 - nameWidth / 2 + coeff, 66); ctx.fillText(ch, 179 - nameWidth / 2 + coeff, 66); coeff += ctx.measureText(ch).width + 2 }

    // 图层 6: 能量数字
    if (showCost && card.energyCost) {
      const cost = card.energyCost; const off = ENERGY_OFFSETS[cost] || { x: 0, y: 0 }
      const eFill = card.energyUpgraded ? C.NAME_UPGRADED : C.ENERGY_FILL
      ctx.font = 'bold 40px Kreon, serif'; ctx.strokeJoin = 'bevel'
      ctx.fillStyle = eFill; ctx.strokeStyle = C.ENERGY_OUTER_STROKE; ctx.lineWidth = 8
      ctx.strokeText(cost, 29.5 - off.x, 51.5 - off.y)
      ctx.strokeStyle = C.ENERGY_INNER_STROKE
      ctx.strokeText(cost, 28 - off.x, 50 - off.y)
      ctx.fillText(cost, 28 - off.x, 50 - off.y)
    }

    // 图层 7: 描述文字
    ctx.font = '25px Kreon, serif'
    const numRows = rows.length
    for (let z = 0; z < numRows; z++) {
      const row = rows[z]; if (!row.string) continue
      let rowWidth = 0
      for (const seg of row.chars) { rowWidth += seg.char === '@' ? 28 : ctx.measureText(seg.char).width + 0.2 }
      rowWidth -= 0.2
      let coeff = 0
      for (const seg of row.chars) {
        if (seg.char === '@' && gemImg) {
          ctx.drawImage(gemImg, 177.6 - rowWidth / 2 + coeff, 324 - 13.5 * (numRows - 1) + z * 28, 28, 28)
          coeff += 28 + 0.2
        } else {
          ctx.fillStyle = C.DESC_SHADOW; ctx.strokeStyle = C.DESC_SHADOW; ctx.lineWidth = 1
          const sx = 183.2 - rowWidth / 2 + coeff
          const sy = 349.3 - 13.5 * (numRows - 1) + z * 28
          ctx.strokeText(seg.char, sx, sy); ctx.fillText(seg.char, sx, sy)
          if (seg.colored === 1) ctx.fillStyle = C.DESC_KEYWORD
          else if (seg.colored === 2) ctx.fillStyle = C.DESC_VALUE
          else ctx.fillStyle = C.DESC_NORMAL
          ctx.strokeStyle = 'transparent'; ctx.lineWidth = 0
          ctx.fillText(seg.char, 180.9 - rowWidth / 2 + coeff, 347.6 - 13.5 * (numRows - 1) + z * 28)
          ctx.fillText(seg.char, 181.2 - rowWidth / 2 + coeff, 347.8 - 13.5 * (numRows - 1) + z * 28)
          coeff += ctx.measureText(seg.char).width + 0.2
        }
      }
    }
  }

  /** 在画布右下角绘制半透明水印 */
  function drawWatermark(text: string) {
    if (!ctx || !text) return
    ctx.save()
    ctx.globalAlpha = 0.35
    ctx.font = '13px Kreon, serif'
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.lineWidth = 2
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.strokeText(text, CARD_WIDTH - 16, CARD_HEIGHT - 10)
    ctx.fillText(text, CARD_WIDTH - 16, CARD_HEIGHT - 10)
    ctx.restore()
  }

  function exportCard(watermarkText?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // 导出前绘制水印（同步操作，不等待）
      if (watermarkText) drawWatermark(watermarkText)

      // #ifdef H5
      try {
        canvas.toBlob((blob: Blob) => {
          const url = URL.createObjectURL(blob)
          resolve(url)
        }, 'image/png')
      } catch {
        resolve(canvas.toDataURL('image/png'))
      }
      // #endif
      // #ifdef MP-WEIXIN
      const dpr = Math.min(uni.getSystemInfoSync().pixelRatio || 2, 2)
      uni.canvasToTempFilePath({
        canvas,
        x: 0, y: 0,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        destWidth: CARD_WIDTH * dpr,
        destHeight: CARD_HEIGHT * dpr,
        fileType: 'png', quality: 1,
        success: (res: any) => resolve(res.tempFilePath),
        fail: reject,
      })
      // #endif
    })
  }

  return { init, renderCard, exportCard }
}
