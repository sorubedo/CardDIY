<template>
  <view class="property-panel">
    <wd-picker v-model="colorVal" :columns="colorOptions" :title="pickerTitleProperties" @confirm="(e: any) => $emit('update:color', e.value)">
      <template #label>
        <view class="picker-label"><wd-icon name="circle" size="16px" /> {{ selectorColorLabel }}</view>
      </template>
    </wd-picker>
    <wd-picker v-if="showTypeAndRarity" v-model="typeVal" :columns="typeOptions" :title="pickerTitleType" @confirm="(e: any) => $emit('update:type', e.value)">
      <template #label>
        <view class="picker-label"><wd-icon name="menu-fold" size="16px" /> {{ selectorTypeLabel }}</view>
      </template>
    </wd-picker>
    <wd-picker v-if="showTypeAndRarity" v-model="rarityVal" :columns="rarityOptions" :title="pickerTitleRarity" @confirm="(e: any) => $emit('update:rarity', e.value)">
      <template #label>
        <view class="picker-label"><wd-icon name="star" size="16px" /> {{ selectorRarityLabel }}</view>
      </template>
    </wd-picker>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CardColor, CardType, CardRarity } from '@/types/card'
import { shouldShowTypeAndRarity } from '@/utils/asset-resolver'

const { t } = useI18n()

const selectorColorLabel = computed(() => t('editor.selectorColor'))
const selectorTypeLabel = computed(() => t('editor.selectorType'))
const selectorRarityLabel = computed(() => t('editor.selectorRarity'))
const pickerTitleProperties = computed(() => t('editor.sectionTitle.properties'))
const pickerTitleType = computed(() => t('typeLabel.Attack'))
const pickerTitleRarity = computed(() => t('rarityLabel.Common'))

const props = defineProps<{ color: CardColor; type: CardType; rarity: CardRarity }>()
defineEmits<{ 'update:color': [v: CardColor]; 'update:type': [v: CardType]; 'update:rarity': [v: CardRarity] }>()

const colorVal = ref(props.color)
const typeVal = ref(props.type)
const rarityVal = ref(props.rarity)
const showTypeAndRarity = computed(() => shouldShowTypeAndRarity(props.color))

const colorOptions = computed(() =>
  Object.values(CardColor).map(v => ({ label: t(`colorLabel.${v}`), value: v }))
)
const typeOptions = computed(() =>
  Object.values(CardType).map(v => ({ label: t(`typeLabel.${v}`), value: v }))
)
const rarityOptions = computed(() =>
  Object.values(CardRarity).map(v => ({ label: t(`rarityLabel.${v}`), value: v }))
)
</script>

<style scoped lang="scss">
.property-panel { background: transparent; }
.picker-label { display: flex; align-items: center; gap: 8rpx; }
</style>
