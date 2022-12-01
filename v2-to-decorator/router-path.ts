/// <reference path="../types/validation.ts" />

import fs from 'fs'
import path from 'path'

const getFilePath = (v: string): string => path.resolve(__dirname, v)

import { handleWriteFile, handleDataToString } from '../utils/index'

/**
 * @name: 路由类
 * @description: 根据路由提取有效的路由路径
 * @return {Array} data 有效的路由路径
 */
class RouterPath {
  /**
   * @name: 前缀
   */
  prefix: string
  /**
   * @name: 路由文件夹目录
   */
  directory: string
  /**
   * @name: 所有路由路径
   */
  allRouter: object[]
  /**
   * @name: 所有真实路径
   */
  realPathList: object[]
  /**
   * @name:  是否生成文件
   */
  isJson: boolean | undefined
  /**
   * @name: 所有路由路径对应的 ast
   */
  astData: { [key: string]: string }
  /**
   * @name: 树型路由结果
   */
  treeRouterResult: object[]
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

  constructor(options: Validation.routerPathType) {
    this.exclude = options.exclude
    this.include = options.include
    this.prefix = options.prefix
    this.directory = options.directory
    this.routeName = options.routeName
    this.includeSuffix = options?.includeSuffix ?? []
    this.allRouter = []
    this.astData = {}
    this.realPathList = [] // 未使用
    this.isJson = options.isJson
    this.treeRouterResult = []
  }

  init(): void {
    this.getRouterPath(this.directory)

    this.isJson && this.handleRouteWriteFile()
  }

  /**
   * @name: 获取路由文件路径
   * @param {string} filePath 路由文件夹
   */
  getRouterPath(filePath: string): void {
    if (!filePath) return

    if (!this.includeSuffix || !this.includeSuffix.length) return

    let files = fs.readdirSync(filePath)
    let exclude: string[] = this.exclude
    let include: string[] = this.include
    let includeSuffix: string[] = this.includeSuffix

    // type: 1文件夹，2文件
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      if (!exclude.includes(file)) {
        let dir = path.join(filePath, file)

        if (fs.statSync(dir).isDirectory()) {
          // this.allRouter.push({
          //   type: 1,
          //   name: dir
          //   fileName: file
          // })
          this.getRouterPath(dir)
        } else {
          if (includeSuffix.find((f) => file.includes(f))) {
            this.allRouter.push({
              type: 2,
              name: dir,
              fileName: file
            })
          }
        }
      }
    }
  }

  /**
   * @name: 生成结果文件
   */
  handleRouteWriteFile() {
    if (this.allRouter && this.allRouter.length) {
      handleWriteFile({
        path: getFilePath('../json/vueJsToTs/all-router-path.json'),
        content: handleDataToString(this.allRouter)
      })
    }
  }
}

export default RouterPath
