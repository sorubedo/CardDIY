<template>
  <view class="art-uploader-panel">
    <view class="art-header" />

    <view class="art-actions">
      <wd-button
        v-if="!cardArt"
        type="primary"
        size="small"
        @click="handleUpload"
      >
        {{ artUploadLabel }}
      </wd-button>
      <template v-else>
        <wd-button type="info" size="small" @click="handleUpload">
          {{ artChangeLabel }}
        </wd-button>
        <wd-button type="warning" size="small" @click="handleRemove">
          {{ artRemoveLabel }}
        </wd-button>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CardArtConfig } from '@/types/card'
import { ART_CLIP_SIZE } from '@/constants/card-constants'

const { t } = useI18n()

const artUploadLabel = computed(() => t('editor.artUpload'))
const artChangeLabel = computed(() => t('editor.artChange'))
const artRemoveLabel = computed(() => t('editor.artRemove'))

const props = defineProps<{
  cardArt: CardArtConfig | null
}>()

const emit = defineEmits<{
  'update:cardArt': [value: CardArtConfig | null]
}>()

function handleUpload() {
  uni.chooseImage({
    count: 1,
    sourceType: ['album'],
    success: (res) => {
      const tempPath = res.tempFilePaths[0]
      // 按 300×300 卡图区域等比居中裁剪
      const cfg: CardArtConfig = {
        imagePath: tempPath,
        x: ART_CLIP_SIZE.x,
        y: ART_CLIP_SIZE.y,
        width: ART_CLIP_SIZE.w,
        height: ART_CLIP_SIZE.h,
      }
      emit('update:cardArt', cfg)
    },
  })
}

function handleRemove() {
  emit('update:cardArt', null)
}
</script>

<style scoped lang="scss">
.art-uploader-panel {
  background: transparent;
}

.art-header {
  padding: 16rpx 32rpx;
}

.panel-label {
  font-size: 28rpx;
  color: #a0a0b0;
}

.art-actions {
  display: flex;
  gap: 16rpx;
  padding: 0 32rpx 16rpx;
}
</style>
