<template>
  <view class="energy-panel">
    <view class="energy-header">
      <text class="panel-label">{{ energyCostLabel }}</text>
    </view>
    <!-- 能量值按钮组 -->
    <view class="energy-buttons">
      <view
        v-for="val in energyValues"
        :key="val"
        class="energy-btn"
        :class="{ 'energy-btn--active': energyCost === val }"
        @click="selectEnergy(val)"
      >
        <text class="energy-btn-text">{{ val }}</text>
      </view>
      <view
        class="energy-btn energy-btn--clear"
        :class="{ 'energy-btn--active': energyCost === '' }"
        @click="selectEnergy('')"
      >
        <text class="energy-btn-text">✕</text>
      </view>
    </view>
    <!-- 升级开关 -->
    <view class="switch-row">
      <text class="switch-label">{{ upgradedEnergyLabel }}</text>
      <wd-switch
        :model-value="upgraded"
        size="24px"
        @change="onUpgradedChange"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ENERGY_VALUES } from '@/constants/card-constants'

const { t } = useI18n()

const energyCostLabel = computed(() => t('editor.energyCost'))
const upgradedEnergyLabel = computed(() => t('editor.upgradedEnergy'))

const props = defineProps<{
  energyCost: string
  upgraded: boolean
}>()

const emit = defineEmits<{
  'update:energyCost': [value: string]
  'update:upgraded': [value: boolean]
}>()

const energyValues = ENERGY_VALUES

function selectEnergy(val: string) {
  emit('update:energyCost', props.energyCost === val ? '' : val)
}

function onUpgradedChange({ value }: { value: boolean }) {
  emit('update:upgraded', value)
}
</script>

<style scoped lang="scss">
.energy-panel {
  background: transparent;
  padding: 16rpx 0;
}

.energy-header {
  padding: 8rpx 32rpx 16rpx;
}

.panel-label {
  font-size: 28rpx;
  color: #a0a0b0;
}

.energy-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  padding: 0 32rpx;
}

.energy-btn {
  width: 80rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;

  &--active {
    background: rgba(233, 69, 96, 0.3);
    border-color: #e94560;
  }

  &--clear {
    background: rgba(255, 255, 255, 0.04);
  }
}

.energy-btn-text {
  font-size: 28rpx;
  color: #fcf8ea;
  font-weight: bold;
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 32rpx;
  margin-top: 16rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.05);
}

.switch-label {
  font-size: 28rpx;
  color: #a0a0b0;
}
</style>
