<template>
  <nav class="site-navbar" :class="'site-navbar--' + navbarLayoutType">
    <div class="site-navbar__header">
      <h1 class="site-navbar__brand" @click="$router.push({name: 'home'})">
        <a class="site-navbar__brand-lg" href="javascript:void(0);">人人快速开发平台</a>
        <a class="site-navbar__brand-mini" href="javascript:void(0);">人人</a>
      </h1>
    </div>
    <div class="site-navbar__body clearfix">
      <el-menu class="site-navbar__menu" mode="horizontal">
        <el-menu-item class="site-navbar__switch" index="0" @click="sidebarFold = !sidebarFold">

        </el-menu-item>
      </el-menu>
    </div>
  </nav>
</template>

<script>
import UpdatePassword from './main-navbar-update-password'
import {clearLoginInfo} from '@/utils'
export default {
  name: 'main-navbar',
  data () {
    return {
      updatePasswordVisible: false
    }
  },
  components: {
    UpdatePassword
  },
  computed: {
    navbarLayoutType: {
      get () { return this.$store.state.common.navbarLayoutType }
    },
    sidebarFold: {
      get () { return this.$store.state.common.sidebarFold },
      set (val) { this.$store.commit('common/updateSidebarFold', val) }
    },
    mainTabs: {
      get () { return this.$store.state.common.mainTabs },
      set (val) { this.$store.commit('common/updateMainTabs', val) }
    },
    userName: {
      get () { return this.$store.state.user.name }
    }
  }
}
</script>

<style scoped>

</style>
