<template>

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
    }
  },
  computed: {
    sidebarLayoutSkin: {
      get () { return this.$store.state.common.sidebarLayoutSkin }
    }
  },
  methods: {
    // 通过menuId和动态菜单路由进行匹配跳转到指定路由
  }
}
</script>

<style scoped>

</style>
