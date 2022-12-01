/// <reference path="../types/validation.ts" />

import RouterPath from '../common/router-path'
import Auth from './auth'
import progress from 'progress'

/**
 * @name: 获取权限列表
 */
class ReadInitialization {
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
   * @name: travel-admin-web 项目接口地址
   */
  baseUrl?: string
  /**
   * @name: travel-admin-web 项目登录 token
   */
  token?: string
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

  constructor(options: Validation.readInitialization) {
    this.isAllJson = options.isAllJson
    this.basePath = options.basePath
    this.exclude = options.exclude
    this.include = options.include
    this.routeName = options.routeName

    this.baseUrl = options.baseUrl
    this.token = options.token

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
      include: this.include
    })
    newRouterPath.init()

    this.progressTop.tick()

    const newAuth = new Auth({
      paths: newRouterPath.treeRouterResult,
      isJson: this.isAllJson,
      basePath: this.basePath,
      baseUrl: this.baseUrl,
      token: this.token
    })
    newAuth.init()

    this.progressTop.tick()
  }

  handleProgress() {
    this.progressTop = new progress('读取中: [:bar] :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 40,
      total: 3
    })
  }
}

export default ReadInitialization
