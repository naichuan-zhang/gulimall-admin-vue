import Mock from 'mockjs'
import * as common from '@/mock/modules/common'

fnCreate(common, false)

/**
 * 创建mock模拟数据
 * @param mod 模块
 * @param isOpen 是否开启mock模拟
 */
function fnCreate (mod, isOpen = true) {
  if (isOpen) {
    for (var key in mod) {
      ((res) => {
        Mock.mock(new RegExp(res.url), res.type, (opts) => {
          opts['data'] = opts.body ? JSON.parse(opts.body) : null
          delete opts.body
          console.log('\n')
          console.log('%cmock拦截, 请求: ', 'color:blue', opts)
          console.log('%cmock拦截, 响应: ', 'color:blue', res.data)
          return res.data
        })
      })(mod[key]() || {})
    }
  }
}
