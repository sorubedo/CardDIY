<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('CardDIY App Launch')
})

onShow(() => {
  console.log('CardDIY App Show')
})

onHide(() => {
  console.log('CardDIY App Hide')
})
</script>

<style lang="scss">
/* 全局样式 */
page {
  background: #0f0f23;
  color: #fcf8ea;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* wot-ui 暗色主题全局适配 */
.wot-theme-dark {
  body,
  page {
    color: #f5f5f5;
    background-color: #0f0f23;
  }
}
</style>
