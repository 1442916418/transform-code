/// <reference path="../types/validation.ts" />

import path from 'path'

import RouterPath from '../common/router-path'
import Read from './read'
import progress from 'progress'

import { handleWriteFile, handleDataToString } from '../utils'

/**
 * @name: 文档类
 */
class DocsInitialization {
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
   * @name: md 文件存放目录
   */
  docsBasePath?: string

  constructor(options: Validation.generateDocsConstructor) {
    this.isAllJson = options.isAllJson
    this.basePath = options.basePath
    this.exclude = options.exclude
    this.include = options.include
    this.routeName = options.routeName
    this.docsBasePath = options.docsBasePath
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

    this.handleMarkdownSidebarList(newRouterPath.treeRouterResult)

    this.progressTop.tick()

    const newRead = new Read({
      paths: newRouterPath.treeRouterResult,
      isJson: this.isAllJson,
      basePath: this.basePath,
      docsBasePath: this.docsBasePath
    })
    newRead.init()

    this.progressTop.tick()
  }

  handleProgress() {
    this.progressTop = new progress('生成中: [:bar] :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: 4
    })
  }

  handleMarkdownSidebarList(list: object[]) {
    if (!list.length) return

    let result: any = []

    list.forEach((v: any) => {
      const menu: any = { title: v.meta.title, path: `/views${v.path}/`, children: [] }

      if (v.children && v.children.length) {
        v.children.forEach((f: any) => {
          menu.children.push({ title: f.meta.title, path: `/views${v.path}/${f.path}/` })
        })
      }

      result.push(menu)
    })

    if (result.length) {
      handleWriteFile({
        path: `${this.docsBasePath}${path.sep}route.json`,
        content: handleDataToString(result)
      })

      this.handleHomeMenu(result)
    }
  }

  handleHomeMenu(list: any) {
    let result: string = '# 概览\n\n'

    list.forEach((v: any) => {
      result += `> [${v.title}](${v.path})  \n`

      v.children.forEach((f: any, j: number) => {
        result += `>> [${f.title}](${f.path})  \n${j + 1 === v.children.length ? '\n' : ''}`
      })
    })

    handleWriteFile({
      path: `${this.docsBasePath}${path.sep}README.md`,
      content: result
    })
  }
}

export default DocsInitialization
