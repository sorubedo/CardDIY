<template>
  <wd-config-provider theme="dark">
    <view class="editor-page">
      <view class="custom-navbar" :style="navbarStyle">
        <view class="navbar-title">Card Maker</view>
        <view class="navbar-action">
          <text v-if="!isLoggedIn" class="navbar-login-btn" @click="showLoginPopup = true">
            {{ t('auth.login') }}
          </text>
          <text v-else class="navbar-username" @click="handleLogout">@{{ userInfo?.nickName }}</text>
          <view class="navbar-divider" />
          <wd-button size="small" type="text" custom-class="lang-btn" @click="switchLang">
            {{ locale === 'zh-CN' ? 'English' : '中文' }}
          </wd-button>
        </view>
      </view>
      <!-- 登录浮层 -->
      <view v-if="showLoginPopup" class="login-overlay" @click="showLoginPopup = false">
        <view class="login-card" @click.stop>
          <view class="login-title">{{ t('auth.login') }}</view>
          <!-- 头像选择：chooseAvatar 事件只返回 avatarUrl，不返回 nickName -->
          <button open-type="chooseAvatar" class="login-avatar-btn" @chooseavatar="onChooseAvatar">
            <image v-if="loginAvatarUrl" class="login-avatar-preview" :src="loginAvatarUrl" mode="aspectFill" />
            <view v-else class="login-avatar-placeholder">👤</view>
            <text>{{ loginAvatarUrl ? t('auth.avatarSelected') : t('auth.chooseAvatar') }}</text>
          </button>
          <!-- type="nickname"：真机键盘上方出现「使用微信昵称」按钮，一键填入 -->
          <input
            v-model="loginNickname"
            type="nickname"
            class="login-nickname-input"
            :placeholder="t('auth.nicknamePlaceholder')"
            maxlength="20"
          />
          <view class="login-actions">
            <wd-button size="small" plain @click="showLoginPopup = false">{{ t('auth.cancel') }}</wd-button>
            <wd-button size="small" type="primary" @click="confirmLogin">{{ t('auth.confirm') }}</wd-button>
          </view>
        </view>
      </view>
      <view class="preview-section">
      <CardPreview ref="cardPreviewRef" :card-data="cardData" :card-assets="cardAssets" :locale="locale" />
    </view>
    <scroll-view class="editor-scroll" scroll-y :show-scrollbar="false">
      <view class="section-card">
        <view class="section-title">{{ sectionTitleProperties }}</view>
        <CardPropertyPanel
          :color="cardData.color" :type="cardData.type" :rarity="cardData.rarity"
          @update:color="(v: CardColor) => cardData.color = v"
          @update:type="(v: CardType) => cardData.type = v"
          @update:rarity="(v: CardRarity) => cardData.rarity = v"
        />
      </view>
      <view class="section-card">
        <CardNameInput :name="cardData.name" :upgraded="cardData.nameUpgraded"
          @update:name="(v: string) => cardData.name = v"
          @update:upgraded="(v: boolean) => cardData.nameUpgraded = v" />
      </view>
      <view v-if="showEnergy" class="section-card">
        <CardEnergyInput :energy-cost="cardData.energyCost" :upgraded="cardData.energyUpgraded"
          @update:energy-cost="(v: string) => cardData.energyCost = v"
          @update:upgraded="(v: boolean) => cardData.energyUpgraded = v" />
      </view>
      <view class="section-card">
        <view class="section-title">{{ sectionTitleDescription }}</view>
        <CardDescriptionInput :lines="cardData.descriptionRows" :num-rows="numOfRows"
          @update:lines="(v: string[]) => cardData.descriptionRows = v"
          @add-line="addDescriptionRow" @remove-line="removeDescriptionRow" />
      </view>
      <view class="section-card">
        <view class="section-title">{{ sectionTitleArt }}</view>
        <CardArtUploader :card-art="cardData.cardArt" @update:card-art="(v) => cardData.cardArt = v" />
      </view>
      <view class="section-card">
        <view class="section-title">{{ sectionTitleExport }}</view>
        <view class="export-actions">
          <wd-button type="primary" block size="large" :loading="isExporting" @click="handleExport">{{ exportPngLabel }}</wd-button>
          <!-- #ifdef MP-WEIXIN -->
          <wd-button type="success" block size="large" @click="handleShare">{{ t('editor.shareToChat') }}</wd-button>
          <!-- #endif -->
        </view>
      </view>
      <view class="reset-section">
        <wd-button type="warning" block size="large" @click="handleReset">{{ resetCardLabel }}</wd-button>
      </view>
      <view class="bottom-safe" />
    </scroll-view>
    <wd-toast /><wd-message-box />
  </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'wot-design-uni/components/wd-message-box/index'
import { CardColor, CardType, CardRarity } from '@/types/card'
import { useCardData } from '@/composables/useCardData'
import { useAuth } from '@/composables/useAuth'
import { useCardExport } from '@/composables/useCardExport'
import CardPreview from '@/components/CardPreview.vue'
import CardPropertyPanel from '@/components/CardPropertyPanel.vue'
import CardNameInput from '@/components/CardNameInput.vue'
import CardEnergyInput from '@/components/CardEnergyInput.vue'
import CardDescriptionInput from '@/components/CardDescriptionInput.vue'
import CardArtUploader from '@/components/CardArtUploader.vue'

const { t, locale } = useI18n()

const sectionTitleProperties = computed(() => t('editor.sectionTitle.properties'))
const sectionTitleDescription = computed(() => t('editor.sectionTitle.description'))
const sectionTitleArt = computed(() => t('editor.sectionTitle.art'))
const sectionTitleExport = computed(() => t('editor.sectionTitle.export'))
const exportPngLabel = computed(() => t('editor.exportPng'))
const resetCardLabel = computed(() => t('editor.resetCard'))

const message = useMessage()

function switchLang() {
  locale.value = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
}

const { cardData, numOfRows, cardAssets, showEnergy, addDescriptionRow, removeDescriptionRow, resetAll } = useCardData()
const { userInfo, isLoggedIn, saveUserInfo, logout } = useAuth()
const { saveToAlbum, shareToChat, setFilename } = useCardExport()
const cardPreviewRef = ref<InstanceType<typeof CardPreview> | null>(null)
const isExporting = ref(false)

// 登录浮层
const showLoginPopup = ref(false)
const loginNickname = ref('')
// chooseAvatar 只返回 avatarUrl（微信不通过此事件返回昵称）
const loginAvatarUrl = ref('')

function onChooseAvatar(e: any) {
  loginAvatarUrl.value = e.detail.avatarUrl || ''
}

function confirmLogin() {
  const name = loginNickname.value.trim()
  if (name) {
    saveUserInfo({ nickName: name, avatarUrl: loginAvatarUrl.value })
    uni.showToast({ title: t('auth.loginSuccess'), icon: 'success' })
    showLoginPopup.value = false
  } else {
    uni.showToast({ title: t('auth.nicknameRequired'), icon: 'none' })
  }
}

// 导航栏适配（状态栏 + 胶囊按钮）
const navbarStyle = ref<Record<string, string>>({})

onMounted(() => {
  // #ifdef MP-WEIXIN
  const sysInfo = uni.getSystemInfoSync()
  const statusBarHeight = sysInfo.statusBarHeight || 20
  const menuButton = uni.getMenuButtonBoundingClientRect()
  // 胶囊占据的宽度（从胶囊左边到屏幕右边缘）
  const capsuleWidth = sysInfo.windowWidth - menuButton.left
  const navHeight = menuButton.bottom + (menuButton.top - statusBarHeight)
  navbarStyle.value = {
    paddingTop: statusBarHeight + 'px',
    height: navHeight + 'px',
    // 右侧留出胶囊宽度 + 间距
    paddingRight: (capsuleWidth + 8) + 'px',
  }
  // #endif
})

async function handleLogout() {
  try {
    await message.confirm({
      title: t('auth.logout'),
      msg: t('auth.confirmLogout'),
      confirmButtonText: locale.value === 'zh-CN' ? '确定' : 'OK',
      cancelButtonText: locale.value === 'zh-CN' ? '取消' : 'Cancel',
    })
    logout()
  } catch { /* cancelled */ }
}

async function handleExport() {
  if (!cardPreviewRef.value) return
  isExporting.value = true
  try {
    setFilename(cardData.name || 'card')
    const watermark = userInfo.value?.nickName ? `@${userInfo.value.nickName}` : undefined
    const path = await cardPreviewRef.value.exportCard(watermark)
    // #ifdef H5
    downloadH5(path)
    // #endif
    // #ifdef MP-WEIXIN
    await saveToAlbum(path)
    // #endif
  } catch (err: any) {
    console.error('Export failed:', err)
    uni.showToast({ title: t('editor.exportFailed'), icon: 'error' })
  } finally { isExporting.value = false }
}

// H5 下载（保留在页面中因为 useCardExport.downloadH5 不带 toast）
function downloadH5(url: string) {
  const link = document.createElement('a')
  link.download = (cardData.name || 'card') + '.png'
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  if (url.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(url), 1000)
  uni.showToast({ title: t('editor.downloaded'), icon: 'success' })
}

async function handleShare() {
  if (!cardPreviewRef.value) return
  try {
    setFilename(cardData.name || 'card')
    const watermark = userInfo.value?.nickName ? `@${userInfo.value.nickName}` : undefined
    const path = await cardPreviewRef.value.exportCard(watermark)
    await shareToChat(path)
  } catch (err: any) {
    console.error('Share failed:', err)
    uni.showToast({ title: t('editor.shareFailed'), icon: 'error' })
  }
}

async function handleReset() {
  try {
    await message.confirm({
      title: t('editor.resetCard'),
      msg: t('editor.confirmReset'),
      confirmButtonText: locale.value === 'zh-CN' ? '确定' : 'OK',
      cancelButtonText: locale.value === 'zh-CN' ? '取消' : 'Cancel',
    })
    resetAll()
  } catch { /* cancelled */ }
}
</script>

<style scoped lang="scss">
.editor-page { min-height: 100vh; background: #0f0f23; }
.custom-navbar { display: flex; align-items: center; justify-content: space-between; padding: 0 24rpx; background: #1a1a2e; box-sizing: border-box; }
.navbar-title { font-size: 32rpx; color: #fcf8ea; font-weight: bold; }
.navbar-action { display: flex; align-items: center; overflow: hidden; }
.navbar-login-btn { font-size: 24rpx; color: #e94560; }
/* 登录浮层 */
.login-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 999; }
.login-card { width: 560rpx; background: #1a1a2e; border-radius: 24rpx; padding: 48rpx 40rpx 36rpx; display: flex; flex-direction: column; align-items: center; }
.login-title { font-size: 34rpx; color: #fcf8ea; font-weight: bold; margin-bottom: 36rpx; }
.login-avatar-btn { width: 100%; height: 88rpx; display: flex; align-items: center; justify-content: center; gap: 12rpx; background: rgba(255,255,255,0.06); border: 2rpx solid rgba(255,255,255,0.12); border-radius: 16rpx; color: #a0a0b0; font-size: 28rpx; margin-bottom: 24rpx; }
.login-avatar-placeholder { width: 48rpx; height: 48rpx; border-radius: 50%; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; font-size: 28rpx; }
.login-avatar-preview { width: 48rpx; height: 48rpx; border-radius: 50%; }
.login-nickname-input { width: 100%; height: 80rpx; background: rgba(255,255,255,0.06); border: 2rpx solid rgba(255,255,255,0.12); border-radius: 16rpx; padding: 0 24rpx; color: #fcf8ea; font-size: 28rpx; text-align: center; margin-bottom: 32rpx; box-sizing: border-box; }
.login-actions { display: flex; gap: 24rpx; width: 100%; }
.navbar-username { font-size: 24rpx; color: #a0a0b0; margin-right: 12rpx; max-width: 160rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.navbar-divider { width: 1px; height: 28rpx; background: rgba(255,255,255,0.15); margin: 0 8rpx; }
:deep(.lang-btn) { color: #e94560 !important; }
.preview-section { padding: 16rpx 0; }
.editor-scroll { height: auto; padding: 0 0 20rpx; }
.section-card { margin: 16rpx 24rpx; background: rgba(255,255,255,0.03); border-radius: 16rpx; overflow: hidden; }
.section-title { padding: 24rpx 32rpx 12rpx; font-size: 28rpx; color: #e94560; font-weight: bold; }
.export-actions { display: flex; flex-direction: column; gap: 16rpx; padding: 16rpx 32rpx 24rpx; }
.reset-section { padding: 32rpx 24rpx 0; }
.bottom-safe { height: 40rpx; }
</style>
