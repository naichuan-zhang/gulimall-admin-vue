import Vue from 'vue'
import Router from 'vue-router'
import http from '@/utils/httpRequest'
import {isURL} from '@/utils/validate'
import {clearLoginInfo} from '@/utils'
import ca from "element-ui/src/locale/lang/ca";

Vue.use(Router)

// 开发环境不使用懒加载, 因为懒加载页面太多的话会造成webpack热更新太慢, 所以只有生产环境使用懒加载
const _import = require('./import-' + process.env.NODE_ENV)

// 全局路由（无需嵌套上左右整体布局）
const globalRoutes = [
  {path: '/404', component: _import.default('common/404'), name: '404', meta: {title: '404未找到'}, children: []},
  {path: '/login', component: _import.default('common/login'), name: 'login', meta: {title: '登录'}, children: []}
]

// 主入口路由（需嵌套上左右整体布局）
const mainRoutes = {
  path: '/',
  component: _import.default('main'),
  name: 'main',
  redirect: {name: 'home'},
  meta: {title: '主入口整体布局'},
  children: [
    // 通过meta对象设置路由展示方式
    // 1. isTab: 是否通过tab展示内容, true: 是, false: 否
    // 2. iframeUrl: 是否通过iframe嵌套展示内容, '以http[s]://开头': 是, '': 否
    // 提示: 如需要通过iframe嵌套展示内容, 但不通过tab打开, 请自行创建组件使用iframe处理!
    { path: '/home', component: _import.default('common/home'), name: 'home', meta: { title: '首页' } },
    { path: '/theme', component: _import.default('common/theme'), name: 'theme', meta: { title: '主题' } },
    // { path: '/demo-echarts', component: _import.default('demo/echarts'), name: 'demo-echarts', meta: { title: 'demo-echarts', isTab: true } },
    // { path: '/demo-ueditor', component: _import.default('demo/ueditor'), name: 'demo-ueditor', meta: { title: 'demo-ueditor', isTab: true } }
  ],
  beforeEnter (to, from, next) {
    let token = Vue.cookie.get('token')
    if (!token || !/\S/.test(token)) {
      clearLoginInfo()
      next({name: 'login'})
    }
    next()
  }
}

const router = new Router({
  mode: 'hash',
  scrollBehavior: () => ({y: 0}),
  isAddDynamicMenuRoutes: false, // 是否已添加动态（菜单）路由
  routes: globalRoutes.concat(mainRoutes)
})

router.beforeEach((to, from, next) => {
  // 添加动态菜单路由
  // 1. 已经添加 or 全局路由，直接访问
  // 2. 获取菜单列表，添加并保存本地存储
  if (router.options.isAddDynamicMenuRoutes || fnCurrentRouteType(to, globalRoutes) === 'global') {
    next()
  } else {
    http({
      url: http.adornUrl('/sys/menu/nav'),
      method: 'get',
      params: http.adornParams()
    }).then(({data}) => {
      if (data && data.code === 0) {
        fnAddDynamicMenuRoutes(data.menuList)
        router.options.isAddDynamicMenuRoutes = true
        console.log('\n最终mainRoutes：\n')
        console.log(mainRoutes)
        console.log('------------------------')
        sessionStorage.setItem('menuList', JSON.stringify(data.menuList || '[]'))
        sessionStorage.setItem('permissions', JSON.stringify(data.permissions || '[]'))
        next({...to, replace: true})
      } else {
        sessionStorage.setItem('menuList', '[]')
        sessionStorage.setItem('permissions', '[]')
        next()
      }
    }).catch((e) => {
      console.log(`%c${e} 请求菜单列表和权限失败，跳转至登录页！！`, 'color:blue')
      router.push({ name: 'login' })
    })
  }
})

/**
 * 判断当前路由类型，global：全局路由，main：主入口路由
 * @param route 当前路由
 * @param globalRoutes 全局路由列表
 */
function fnCurrentRouteType (route, globalRoutes = []) {
  var temp = []
  for (var i = 0; i < globalRoutes.length; i++) {
    if (globalRoutes[i].path === route.path) {
      // 若当前访问的路由path在全局路由列表中存在，则为global
      return 'global'
    } else if (globalRoutes[i].children && globalRoutes[i].children.length > 0) {
      temp = temp.concat(globalRoutes[i].children)
    }
  }
  return temp.length > 0 ? fnCurrentRouteType(route, temp) : 'main'
}

/**
 * 添加动态菜单路由
 * @param menuList 菜单列表
 * @param routes 递归创建的动态菜单路由
 */
function fnAddDynamicMenuRoutes (menuList = [], routes = []) {
  // debugger
  var temp = []
  for (var i = 0; i < menuList.length; i++) {
    if (menuList[i].list && menuList[i].list.length > 0) {
      // 如果当前菜单还包含子菜单时，添加到temp
      for (var j = 0; j < menuList[i].list.length; j++) {
        // temp = temp.concat(menuList[i].list)
        if (menuList[i].list[j].url) {
          temp.push(menuList[i].list[j])
        }
      }
    } else if (menuList[i].url && /\S/.test(menuList[i].url)) {
      // 如果当前菜单没有子菜单并且url不为空时
      // 去掉url开头的/，例如：sys/log，sys/login等
      menuList[i].url = menuList[i].url.replace(/^\//, '')
      var route = {
        path: menuList[i].url.replace('/', '-'),
        component: null,
        name: menuList[i].url.replace('/', '-'),
        meta: {
          menuId: menuList[i].menuId,
          title: menuList[i].name,
          isDynamic: true,
          isTab: true,
          iframeUrl: ''
        }
      }
      // url以http(s)://开头，通过iframe展示
      if (isURL(menuList[i].url)) {
        route['path'] = `i-${menuList[i].menuId}`
        route['name'] = `i-${menuList[i].menuId}`
        route['meta']['iframeUrl'] = menuList[i].url
      } else {
        // 如果不是http(s)://开头的路径，则添加component，说明是一个vue component
        try {
          route['component'] = _import.default(`modules/${menuList[i].url}`) || null
        } catch (e) {}
      }
      routes.push(route)
    }
  }
  if (temp.length > 0) {
    fnAddDynamicMenuRoutes(temp, routes)
  } else {
    // 说明该菜单已无子菜单
    mainRoutes.name = 'main-dynamic'
    mainRoutes.children = routes
    router.addRoutes([
      mainRoutes,
      {path: '*', redirect: {name: '404'}}
    ])
    sessionStorage.setItem('dynamicMenuRoutes', JSON.stringify(mainRoutes.children))
    console.log('\n')
    console.log('%c!<-------------------- 动态(菜单)路由 s -------------------->', 'color:blue')
    console.log(mainRoutes.children)
    console.log('%c!<-------------------- 动态(菜单)路由 e -------------------->', 'color:blue')
  }
}

/*
{
    "msg": "success",
    "menuList": [
        {
            "menuId": 1,
            "parentId": 0,
            "parentName": null,
            "name": "系统管理",
            "url": null,
            "perms": null,
            "type": 0,
            "icon": "system",
            "orderNum": 0,
            "open": null,
            "list": [
                {
                    "menuId": 2,
                    "parentId": 1,
                    "parentName": null,
                    "name": "管理员列表",
                    "url": "sys/user",
                    "perms": null,
                    "type": 1,
                    "icon": "admin",
                    "orderNum": 1,
                    "open": null,
                    "list": [
                        {
                            "menuId": 15,
                            "parentId": 2,
                            "parentName": null,
                            "name": "查看",
                            "url": null,
                            "perms": "sys:user:list,sys:user:info",
                            "type": 2,
                            "icon": null,
                            "orderNum": 0,
                            "open": null,
                            "list": []
                        },
                        {
                            "menuId": 16,
                            "parentId": 2,
                            "parentName": null,
                            "name": "新增",
                            "url": null,
                            "perms": "sys:user:save,sys:role:select",
                            "type": 2,
                            "icon": null,
                            "orderNum": 0,
                            "open": null,
                            "list": []
                        },
                        {
                            "menuId": 17,
                            "parentId": 2,
                            "parentName": null,
                            "name": "修改",
                            "url": null,
                            "perms": "sys:user:update,sys:role:select",
                            "type": 2,
                            "icon": null,
                            "orderNum": 0,
                            "open": null,
                            "list": []
                        },
                        {
                            "menuId": 18,
                            "parentId": 2,
                            "parentName": null,
                            "name": "删除",
                            "url": null,
                            "perms": "sys:user:delete",
                            "type": 2,
                            "icon": null,
                            "orderNum": 0,
                            "open": null,
                            "list": []
                        }
                    ]
                },
                {
                    "menuId": 3,
                    "parentId": 1,
                    "parentName": null,
                    "name": "角色管理",
                    "url": "sys/role",
                    "perms": null,
                    "type": 1,
                    "icon": "role",
                    "orderNum": 2,
                    "open": null,
                    "list": [
                        {
                            "menuId": 19,
                            "parentId": 3,
                            "parentName": null,
                            "name": "查看",
                            "url": null,
                            "perms": "sys:role:list,sys:role:info",
                            "type": 2,
                            "icon": null,
                            "orderNum": 0,
                            "open": null,
                            "list": []
                        },
                        {
                            "menuId": 20,
                            "parentId": 3,
                            "parentName": null,
                            "name": "新增",
                            "url": null,
                            "perms": "sys:role:save,sys:menu:list",
                            "type": 2,
                            "icon": null,
                            "orderNum": 0,
                            "open": null,
                            "list": []
                        },
                        {
                            "menuId": 21,
                            "parentId": 3,
                            "parentName": null,
                            "name": "修改",
                            "url": null,
                            "perms": "sys:role:update,sys:menu:list",
                            "type": 2,
                            "icon": null,
                            "orderNum": 0,
                            "open": null,
                            "list": []
                        },
                        {
                            "menuId": 22,
                            "parentId": 3,
                            "parentName": null,
                            "name": "删除",
                            "url": null,
                            "perms": "sys:role:delete",
                            "type": 2,
                            "icon": null,
                            "orderNum": 0,
                            "open": null,
                            "list": []
                        }
                    ]
                },
                {
                    "menuId": 4,
                    "parentId": 1,
                    "parentName": null,
                    "name": "菜单管理",
                    "url": "sys/menu",
                    "perms": null,
                    "type": 1,
                    "icon": "menu",
                    "orderNum": 3,
                    "open": null,
                    "list": [
                        {
                            "menuId": 23,
                            "parentId": 4,
                            "parentName": null,
                            "name": "查看",
                            "url": null,
                            "perms": "sys:menu:list,sys:menu:info",
                            "type": 2,
                            "icon": null,
                            "orderNum": 0,
                            "open": null,
                            "list": []
                        },
                        {
                            "menuId": 24,
                            "parentId": 4,
                            "parentName": null,
                            "name": "新增",
                            "url": null,
                            "perms": "sys:menu:save,sys:menu:select",
                            "type": 2,
                            "icon": null,
                            "orderNum": 0,
                            "open": null,
                            "list": []
                        },
                        {
                            "menuId": 25,
                            "parentId": 4,
                            "parentName": null,
                            "name": "修改",
                            "url": null,
                            "perms": "sys:menu:update,sys:menu:select",
                            "type": 2,
                            "icon": null,
                            "orderNum": 0,
                            "open": null,
                            "list": []
                        },
                        {
                            "menuId": 26,
                            "parentId": 4,
                            "parentName": null,
                            "name": "删除",
                            "url": null,
                            "perms": "sys:menu:delete",
                            "type": 2,
                            "icon": null,
                            "orderNum": 0,
                            "open": null,
                            "list": []
                        }
                    ]
                },
                {
                    "menuId": 5,
                    "parentId": 1,
                    "parentName": null,
                    "name": "SQL监控",
                    "url": "http://localhost:8080/renren-fast/druid/sql.html",
                    "perms": null,
                    "type": 1,
                    "icon": "sql",
                    "orderNum": 4,
                    "open": null,
                    "list": []
                },
                {
                    "menuId": 6,
                    "parentId": 1,
                    "parentName": null,
                    "name": "定时任务",
                    "url": "job/schedule",
                    "perms": null,
                    "type": 1,
                    "icon": "job",
                    "orderNum": 5,
                    "open": null,
                    "list": [
                        {
                            "menuId": 7,
                            "parentId": 6,
                            "parentName": null,
                            "name": "查看",
                            "url": null,
                            "perms": "sys:schedule:list,sys:schedule:info",
                            "type": 2,
                            "icon": null,
                            "orderNum": 0,
                            "open": null,
                            "list": []
                        },
                        {
                            "menuId": 8,
                            "parentId": 6,
                            "parentName": null,
                            "name": "新增",
                            "url": null,
                            "perms": "sys:schedule:save",
                            "type": 2,
                            "icon": null,
                            "orderNum": 0,
                            "open": null,
                            "list": []
                        },
                        {
                            "menuId": 9,
                            "parentId": 6,
                            "parentName": null,
                            "name": "修改",
                            "url": null,
                            "perms": "sys:schedule:update",
                            "type": 2,
                            "icon": null,
                            "orderNum": 0,
                            "open": null,
                            "list": []
                        },
                        {
                            "menuId": 10,
                            "parentId": 6,
                            "parentName": null,
                            "name": "删除",
                            "url": null,
                            "perms": "sys:schedule:delete",
                            "type": 2,
                            "icon": null,
                            "orderNum": 0,
                            "open": null,
                            "list": []
                        },
                        {
                            "menuId": 11,
                            "parentId": 6,
                            "parentName": null,
                            "name": "暂停",
                            "url": null,
                            "perms": "sys:schedule:pause",
                            "type": 2,
                            "icon": null,
                            "orderNum": 0,
                            "open": null,
                            "list": []
                        },
                        {
                            "menuId": 12,
                            "parentId": 6,
                            "parentName": null,
                            "name": "恢复",
                            "url": null,
                            "perms": "sys:schedule:resume",
                            "type": 2,
                            "icon": null,
                            "orderNum": 0,
                            "open": null,
                            "list": []
                        },
                        {
                            "menuId": 13,
                            "parentId": 6,
                            "parentName": null,
                            "name": "立即执行",
                            "url": null,
                            "perms": "sys:schedule:run",
                            "type": 2,
                            "icon": null,
                            "orderNum": 0,
                            "open": null,
                            "list": []
                        },
                        {
                            "menuId": 14,
                            "parentId": 6,
                            "parentName": null,
                            "name": "日志列表",
                            "url": null,
                            "perms": "sys:schedule:log",
                            "type": 2,
                            "icon": null,
                            "orderNum": 0,
                            "open": null,
                            "list": []
                        }
                    ]
                },
                {
                    "menuId": 27,
                    "parentId": 1,
                    "parentName": null,
                    "name": "参数管理",
                    "url": "sys/config",
                    "perms": "sys:config:list,sys:config:info,sys:config:save,sys:config:update,sys:config:delete",
                    "type": 1,
                    "icon": "config",
                    "orderNum": 6,
                    "open": null,
                    "list": []
                },
                {
                    "menuId": 29,
                    "parentId": 1,
                    "parentName": null,
                    "name": "系统日志",
                    "url": "sys/log",
                    "perms": "sys:log:list",
                    "type": 1,
                    "icon": "log",
                    "orderNum": 7,
                    "open": null,
                    "list": []
                },
                {
                    "menuId": 30,
                    "parentId": 1,
                    "parentName": null,
                    "name": "文件上传",
                    "url": "oss/oss",
                    "perms": "sys:oss:all",
                    "type": 1,
                    "icon": "oss",
                    "orderNum": 6,
                    "open": null,
                    "list": []
                }
            ]
        }
    ],
    "code": 0,
    "permissions": [
        "sys:schedule:info",
        "sys:menu:update",
        "sys:menu:delete",
        "sys:config:info",
        "sys:menu:list",
        "sys:config:save",
        "sys:config:update",
        "sys:schedule:resume",
        "sys:user:delete",
        "sys:config:list",
        "sys:user:update",
        "sys:role:list",
        "sys:menu:info",
        "sys:menu:select",
        "sys:schedule:update",
        "sys:schedule:save",
        "sys:role:select",
        "sys:user:list",
        "sys:menu:save",
        "sys:role:save",
        "sys:schedule:log",
        "sys:role:info",
        "sys:schedule:delete",
        "sys:role:update",
        "sys:schedule:list",
        "sys:user:info",
        "sys:schedule:run",
        "sys:config:delete",
        "sys:role:delete",
        "sys:user:save",
        "sys:schedule:pause",
        "sys:log:list",
        "sys:oss:all"
    ]
}
 */

export default router
