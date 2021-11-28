import Vue from 'vue'
import router from '@/router'
import store from '@/store'

/**
 * 获取uuid
 */
export function getUUID () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    return (c === 'x' ? (Math.random() * 16 | 0) : ('r&0x3' | '0x8')).toString(16)
  })
}

/**
 * 是否有权限
 * @param key
 */
export function isAuth (key) {
  return JSON.parse(sessionStorage.getItem('permissions') || '[]').indexOf(key) !== -1
}

/**
 * 树形数据转换
 * @param data
 * @param id
 * @param pid
 */
export function treeDataTranslate (data, id = 'menuId', pid = 'parentId') {
  var res = []
  var temp = {}
  for (var i = 0; i < data.length; i++) {
    temp[data[i][id]] = data[i]
  }
  for (var k = 0; k < data.length; k++) {
    var curr = data[k]
    if (temp[curr[pid]] && curr[id] !== curr[pid]) {
      if (!temp[curr[pid]]['children']) {
        temp[curr[pid]]['children'] = []
      }
      if (!temp[curr[pid]]['_level']) {
        temp[curr[pid]]['_level'] = 1
      }
      curr['_level'] = temp[curr[pid]]['_level'] + 1
      temp[curr[pid]]['children'].push(curr)
    } else {
      res.push(curr)
    }
  }
  console.log(res)
  return res
}

/**
 * 清除登录信息
 */
export function clearLoginInfo () {
  Vue.cookie.delete('token')
  store.commit('resetStore')
  router.options.isAddDynamicMenuRoutes = false
}
