<template>
  <view class="card-preview-wrapper">
    <view class="card-canvas-container">
      <canvas
        ref="canvasRef"
        id="cardCanvas"
        type="2d"
        class="card-canvas"
        :style="{ width: CARD_WIDTH + 'px', height: CARD_HEIGHT + 'px' }"
        disable-scroll
      />
    </view>
    <text v-if="err" class="err">{{ err }}</text>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, getCurrentInstance } from 'vue'
import type { CardData, CardAssets } from '@/types/card'
import { CARD_WIDTH, CARD_HEIGHT } from '@/constants/card-constants'
import { useCardRenderer } from '@/composables/useCardRenderer'

const props = defineProps<{ cardData: CardData; cardAssets: CardAssets; locale?: string }>()
const instance = getCurrentInstance()
const canvasRef = ref<any>(null)
const renderer = useCardRenderer('cardCanvas')
const ready = ref(false)
const err = ref('')

watch(() => [props.cardData, props.cardAssets, props.locale], () => {
  if (ready.value) renderer.renderCard(props.cardData, props.cardAssets, props.locale)
}, { deep: true })

async function loadFonts() {
  // #ifdef H5
  for (const cfg of [
    { family: 'Kreon', source: 'url("/static/card-assets/fonts/Kreon.ttf")' },
    { family: 'Kreon', source: 'url("/static/card-assets/fonts/Kreon-Bold.ttf")', desc: { style: 'normal', weight: 'bold' } },
  ]) {
    await new Promise<void>((resolve) => {
      uni.loadFontFace({ ...cfg, global: true, success: () => resolve(), fail: () => resolve() })
    })
  }
  if (typeof document !== 'undefined' && document.fonts) await document.fonts.ready
  // #endif
  // #ifdef MP-WEIXIN
  // 微信小程序 loadFontFace 仅支持 HTTPS 网络字体，本地字体无法加载，Canvas 回退到 serif
  // #endif
}

onMounted(async () => {
  try {
    await renderer.init(canvasRef.value || instance?.proxy || instance)
    await loadFonts()
    ready.value = true
    await renderer.renderCard(props.cardData, props.cardAssets, props.locale)
  } catch (e: any) {
    err.value = e.message || String(e)
  }
})

defineExpose({
  exportCard: async (watermarkText?: string) => {
    const path = await renderer.exportCard(watermarkText)
    // 如果画了水印，异步重绘恢复无水印预览（不阻塞 path 返回，失败不影响导出结果）
    if (watermarkText) {
      renderer.renderCard(props.cardData, props.cardAssets, props.locale).catch(() => {})
    }
    return path
  },
  renderCard: (c: CardData, a: CardAssets, l?: string) => renderer.renderCard(c, a, l),
})
</script>

<style scoped lang="scss">
.card-preview-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20rpx;
  width: 100%;
}
.card-canvas-container {
  width: 350px;
  height: 455px;
  overflow: hidden;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.3);
  background: #1a1a2e;
}
.card-canvas {
  display: block;
}
.err {
  color: #f44;
  font-size: 22rpx;
  margin-top: 12rpx;
  word-break: break-all;
}
</style>
