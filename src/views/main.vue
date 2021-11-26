<template>
  <div class="site-wrapper"
       :class="{'site-sidebar--fold': sidebarFold}"
       v-loading.fullscreen.lock="loading"
       element-loading-text="拼命加载中">
    <template v-if="!loading">
      <main-navbar/>
      <main-sidebar/>
    </template>
  </div>
</template>

<script>
import MainNavbar from '@/views/main-navbar'
import MainSidebar from '@/views/main-sidebar'
export default {
  components: {MainSidebar, MainNavbar}
}
</script>
