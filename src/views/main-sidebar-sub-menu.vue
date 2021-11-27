<template>
  <el-submenu
    v-if="menu.list && menu.list.length >= 1 && isRoot"
    :index="menu.menuId + ''"
    :popper-class="'site-sidebar--' + sidebarLayoutSkin + '-popper'">
    <template slot="title">
      <icon-svg :name="menu.icon || ''" class="site-sidebar__menu-icon"></icon-svg>
      <span>{{ menu.name }}</span>
    </template>
    <sub-menu
      v-for="item in menu.list"
      :key="item.menuId"
      :menu="item"
      :dynamic-menu-routes="dynamicMenuRoutes"
      :is-root="false">
    </sub-menu>
  </el-submenu>
  <el-menu-item v-else :index="menu.menuId + ''" @click="gotoRouteHandle(menu)">
    <icon-svg :name="menu.icon || ''" class="site-sidebar__menu-icon"></icon-svg>
    <span>{{ menu.name }}</span>
  </el-menu-item>
</template>

<script>
export default {
  name: 'sub-menu',
  props: {
    menu: {
      type: Object,
      required: true
    },
    dynamicMenuRoutes: {
      type: Array,
      required: true
    },
    isRoot: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    sidebarLayoutSkin: {
      get () { return this.$store.state.common.sidebarLayoutSkin }
    }
  },
  methods: {
    // 通过menuId和动态菜单路由进行匹配跳转到指定路由
    gotoRouteHandle (menu) {
      console.log(menu)
      var route = this.dynamicMenuRoutes.filter(item => item.meta.menuId === menu.menuId)
      if (route.length > 0) {
        this.$router.push({name: route[0].name})
      }
    }
  }
}
</script>
