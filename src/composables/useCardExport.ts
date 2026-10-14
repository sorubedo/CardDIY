/**
 * 卡牌导出为 PNG 并保存/分享
 *
 * 依赖 CardPreview 的 exportCard 方法（返回临时文件路径）。
 * 小程序端支持保存到相册和分享到聊天，H5 端触发浏览器下载。
 */
export function useCardExport() {
  let filename = 'card.png'

  function setFilename(name: string) {
    filename = (name || 'card') + '.png'
  }

  /** 保存到相册（含权限处理） */
  async function saveToAlbum(filePath: string): Promise<void> {
    // #ifdef MP-WEIXIN
    try {
      // 检查并请求相册权限
      const setting = await uni.getSetting()
      if (!setting.authSetting['scope.writePhotosAlbum']) {
        await uni.authorize({ scope: 'scope.writePhotosAlbum' })
      }
      await uni.saveImageToPhotosAlbum({ filePath })
      uni.showToast({ title: '已保存到相册', icon: 'success' })
    } catch (err: any) {
      if (err.errMsg?.includes('auth deny') || err.errMsg?.includes('deny')) {
        const res = await uni.showModal({
          title: '需要相册权限',
          content: '请在设置中允许访问相册',
          confirmText: '去设置',
        })
        if (res.confirm) uni.openSetting({})
      }
      throw err
    }
    // #endif

    // #ifdef H5
    downloadH5(filePath)
    // #endif
  }

  /** 弹出原生分享面板（分享/收藏/保存），不要求 tap 手势上下文 */
  async function shareToChat(tempPath: string): Promise<void> {
    // #ifdef MP-WEIXIN
    // 加短暂延迟确保 canvas 临时文件已完全写入
    await new Promise(r => setTimeout(r, 150))
    ;(uni as any).showShareImageMenu?.({
      path: tempPath,
      fail: (err: any) => {
        // 用户取消分享不提示
        if (err.errMsg?.includes('cancel')) return
        console.error('Share failed:', err)
        uni.showToast({ title: '分享失败', icon: 'error' })
      },
    })
    // #endif

    // #ifdef H5
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const blob = await fetch(tempPath).then(r => r.blob())
        const file = new File([blob], filename, { type: 'image/png' })
        await navigator.share({ files: [file] })
      } catch { /* 用户取消 */ }
    } else {
      uni.showToast({ title: '此平台不支持分享', icon: 'none' })
    }
    // #endif
  }

  /** H5 下载 */
  function downloadH5(url: string) {
    const link = document.createElement('a')
    link.download = filename
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    if (url.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(url), 1000)
    uni.showToast({ title: '下载完成', icon: 'success' })
  }

  return {
    setFilename,
    saveToAlbum,
    shareToChat,
    downloadH5,
  }
}
