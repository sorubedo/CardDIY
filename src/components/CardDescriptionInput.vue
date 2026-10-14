<template>
  <view class="desc-panel">
    <view class="desc-hint">{{ descHint }}</view>
    <view v-for="(line, index) in displayLines" :key="index" class="desc-row">
      <wd-input
        :model-value="line"
        :label="`Line ${index + 1}`"
        :maxlength="30"
        :placeholder="descPlaceholderLabel"
        clearable
        prefix-icon="edit-outline"
        @update:model-value="(v: any) => onLineChange(index, v)"
      />
    </view>
    <view class="desc-actions">
      <wd-button v-if="numRows < MAX_ROWS" type="info" size="small" icon="add" @click="addRow">{{ addLineLabel }}</wd-button>
      <wd-button v-if="numRows > 1" type="info" size="small" icon="minus" @click="removeRow">{{ removeLineLabel }}</wd-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { MAX_DESCRIPTION_ROWS } from '@/constants/card-constants'

const { t } = useI18n()
const MAX_ROWS = MAX_DESCRIPTION_ROWS
const props = defineProps<{ lines: string[]; numRows: number }>()
const emit = defineEmits<{ 'update:lines': [value: string[]]; 'add-line': []; 'remove-line': [] }>()

const displayLines = computed(() => props.lines.slice(0, props.numRows))
const descHint = computed(() => t('editor.descHint'))
const descPlaceholderLabel = computed(() => t('editor.descPlaceholder'))
const addLineLabel = computed(() => t('editor.addLine'))
const removeLineLabel = computed(() => t('editor.removeLine'))

function onLineChange(index: number, value: string) {
  const arr = [...props.lines]
  while (arr.length <= index) arr.push('')
  arr[index] = value
  emit('update:lines', arr)
}
function addRow() { emit('add-line') }
function removeRow() { emit('remove-line') }
</script>

<style scoped lang="scss">
.desc-panel { background: transparent; }
.desc-hint { padding: 12rpx 32rpx; margin-top: 12rpx; border-top: 1rpx solid rgba(255,255,255,0.05); font-size: 24rpx; color: #a0a0b0; line-height: 1.5; }
.desc-row { padding: 0 32rpx 12rpx; }
.desc-actions { display: flex; gap: 12rpx; padding: 0 32rpx 16rpx; }
</style>
