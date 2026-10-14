import { ref, computed } from 'vue'
import type { UserInfo } from '@/types/card'

const STORAGE_KEY = 'userInfo'
const ANONYMOUS_NAME = '微信用户'

// 模块级单例，全局共享一份状态
const userInfo = ref<UserInfo | null>(null)

// 模块加载时自动从 storage 恢复
function loadFromStorage(): void {
  try {
    const stored = uni.getStorageSync(STORAGE_KEY)
    if (stored && stored.nickName && stored.nickName !== ANONYMOUS_NAME) {
      userInfo.value = stored
    }
  } catch {
    // storage 读取失败，忽略
  }
}

// 保存到 storage
function saveToStorage(info: UserInfo): void {
  try {
    uni.setStorageSync(STORAGE_KEY, info)
  } catch {
    // storage 写入失败，忽略
  }
}

// 清除 storage
function clearStorage(): void {
  try {
    uni.removeStorageSync(STORAGE_KEY)
  } catch {
    // storage 删除失败，忽略
  }
}

// 模块加载时执行
loadFromStorage()

export function useAuth() {
  const isLoggedIn = computed(() => {
    return !!userInfo.value?.nickName && userInfo.value.nickName !== ANONYMOUS_NAME
  })

  /**
   * 保存用户信息（供 chooseAvatar 回调使用）。
   * 微信小程序中通过 <button open-type="chooseAvatar"> 获取昵称后调用此方法。
   */
  function saveUserInfo(info: UserInfo) {
    if (info.nickName && info.nickName !== ANONYMOUS_NAME) {
      userInfo.value = info
      saveToStorage(info)
    }
  }

  /** 退出登录 */
  function logout(): void {
    userInfo.value = null
    clearStorage()
  }

  return {
    userInfo,
    isLoggedIn,
    saveUserInfo,
    logout,
  }
}
