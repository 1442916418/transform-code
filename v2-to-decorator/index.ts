/// <reference path="../types/validation.ts" />

import progress from 'progress'

import RouterPath from './router-path'
import ParseVue from './parse-vue'

/**
 * @name: Vue Js to Ts
 * @description Vue2.x script 代码转换成 Vue2.x Class Components(ts) 写法
 */
class VueJsToTsInitialization {
  /**
   * @name: 是否生成结果文件
   */
  isAllJson: boolean | undefined
  /**
   * @name: 基础绝对路径
   */
  basePath: string
  /**
   * @name: 进度条
   */
  progressTop: any
  /**
   * @name: 排除的文件夹(模块)
   */
  exclude: string[]
  /**
   * @name: 需要的文件夹(模块)，空数组则是全部
   */
  include: string[]
  /**
   * @name: 路由文件夹名称
   */
  routeName: string
  /**
   * type 为 ts 时，需要匹配文件的后缀名
   */
  includeSuffix?: string[]

  constructor(options: Validation.VueJsToTsConstructor) {
    this.isAllJson = options.isAllJson
    this.basePath = options.basePath
    this.exclude = options.exclude
    this.include = options.include
    this.routeName = options.routeName
    this.includeSuffix = options?.includeSuffix ?? void 0
    this.progressTop = null
  }

  init() {
    this.handleProgress()

    this.progressTop.tick()

    const newRouterPath = new RouterPath({
      directory: this.basePath,
      routeName: this.routeName,
      prefix: this.basePath,
      isJson: this.isAllJson,
      exclude: this.exclude,
      include: this.include,
      includeSuffix: this.includeSuffix
    })
    newRouterPath.init()

    this.progressTop.tick()

    const newParseVue = new ParseVue({
      paths: newRouterPath.allRouter,
      isJson: this.isAllJson,
      basePath: this.basePath
    })
    newParseVue.init()

    this.progressTop.tick()
  }

  handleProgress() {
    this.progressTop = new progress('生成中: [:bar] :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: 3
    })
  }
}

export default VueJsToTsInitialization
