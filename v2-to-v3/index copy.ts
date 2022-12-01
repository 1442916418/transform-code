/// <reference path="../types/validation.ts" />

import path from 'path'

import RouterPath from '../common/router-path'
import ParseRouterContext from '../common/parse-router'

import { handleWriteFile, handleDataToString } from '../utils/index'

const log = console.log
const getFilePath = (v: string): string => path.resolve(__dirname, v)

const $ = require('gogocode')

class Vue3Code extends RouterPath {
  /**
   * @name: 是否生成结果文件
   */
  isAllJson: boolean | undefined
  /**
   * @name: 基础绝对路径
   */
  basePath: string
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

  constructor(options: Validation.vue3Constructor) {
    super({
      directory: options.basePath,
      routeName: options.routeName,
      prefix: options.basePath,
      isJson: options.isAllJson,
      exclude: options.exclude,
      include: options.include
    })

    this.isAllJson = options.isAllJson
    this.basePath = options.basePath
    this.exclude = options.exclude
    this.include = options.include
    this.routeName = options.routeName
  }

  /**
   * Vue3Code 类 - 初始化
   */
  initialization() {
    this.init()
    this.handleVue2RouterAst()
  }

  /**
   * // TODO: 转换为 vue3 写法
   * 根据路由里的路径，处理为 ast
   */
  handleVue2RouterAst() {
    const paths: any = ParseRouterContext.init(this.treeRouterResult, this.basePath)

    if (!paths.length) return

    paths.forEach((item: any) => {
      handleWriteFile({
        path: getFilePath(`../json/vue3/${item.name}.json`),
        content: handleDataToString(item, ['ast', 'scriptAst'])
      })

      if (item.children.length) {
        item.children.forEach((child: any) => {
          handleWriteFile({
            path: getFilePath(`../json/vue3/${item.name}-${child.name}.json`),
            content: handleDataToString(child)
          })
        })
      }
    })

    // const scriptAst = paths[0].children[0].scriptAst

    // if (scriptAst) {
    //   const t1 = scriptAst.find('dialogFormVisible = false')

    //   // handleWriteFile({
    //   //   path: getFilePath('../json/vue3/test.json'),
    //   //   content: handleDataToString(t1)
    //   // })
    // }
  }
}

export default Vue3Code
