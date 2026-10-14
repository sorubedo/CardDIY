<template>
  <view class="name-panel">
    <wd-input
      v-model="localName"
      :label="nameInputLabel"
      :maxlength="18"
      :placeholder="namePlaceholderLabel"
      clearable
      prefix-icon="edit"
      @input="onNameChange"
    />
    <view class="switch-row">
      <text class="switch-label">{{ upgradedLabel }}</text>
      <wd-switch :model-value="upgraded" size="24px" @change="onUpgradedChange" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const nameInputLabel = computed(() => t('editor.nameInput'))
const namePlaceholderLabel = computed(() => t('editor.namePlaceholder'))
const upgradedLabel = computed(() => t('editor.upgraded') + ' (+)')

const props = defineProps<{ name: string; upgraded: boolean }>()
const emit = defineEmits<{ 'update:name': [value: string]; 'update:upgraded': [value: boolean] }>()

const localName = ref(props.name)
watch(() => props.name, (v) => { localName.value = v })

function onNameChange({ value }: { value: string }) { emit('update:name', value) }
function onUpgradedChange({ value }: { value: boolean }) { emit('update:upgraded', value) }
</script>

<style scoped lang="scss">
.name-panel { background: transparent; }
.switch-row { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 32rpx; border-top: 1rpx solid rgba(255,255,255,0.05); }
.switch-label { font-size: 28rpx; color: #a0a0b0; }
</style>
