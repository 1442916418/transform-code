/// <reference path="../types/validation.ts" />

import progress from 'progress'

const compiler = require('vue-template-compiler')
const babylon = require('@babel/parser')

import fs from 'fs'
import path from 'path'

import { handleWriteFile, handleDataToString } from '../utils/index'

import TranslateTs from './translate'
import NewVue from './new-vue'

interface options {
  paths: object[]
  isJson?: boolean
  basePath: string
}

/**
 * @name: 解析 vue2.x script 旧语法
 * @description: 根据路由路径解析
 */
class ParseVue {
  /**
   * @name: 需要读取的路由
   */
  paths: object[]
  /**
   * @name: 是否生成文件
   */
  isJson?: boolean
  /**
   * @name: 项目绝对路径
   */
  basePath: string

  constructor(options: options) {
    this.paths = options.paths
    this.isJson = options.isJson
    this.basePath = options.basePath
  }

  init(): void {
    this.handleReadFileAstData()
    this.handleTranslateTs()
    this.handleNewVue()

    this.isJson && this.handleFieldWriteFile()
  }

  handleNewVue() {
    if (!this.paths) return

    this.paths.forEach((item: any) => {
      if (this.getIsNotTs(item)) {
        const newVueTs = new NewVue(item)
        newVueTs.init()
      }
    })
  }

  handleTranslateTs() {
    if (!this.paths) return

    this.paths.forEach((item: any) => {
      if (this.getIsNotTs(item)) {
        const newTranslateTs = new TranslateTs(item)
        newTranslateTs.init()

        item.scriptTsCode = newTranslateTs.getResult()
      }
    })
  }

  getIsNotTs(item: any): boolean {
    const script = item.ast.script
    const isNotTs =
      !('lang' in script) ||
      ('lang' in script && script.lang !== 'ts') ||
      ('lang' in script.attrs && script.attrs.lang !== 'ts')

    return isNotTs
  }

  /**
   * @name: 获取源文件
   * @description 获取源文件内容，并解析得到源授权数据
   */
  handleReadFileAstData(): void {
    if (!this.paths) return

    this.paths.forEach((item: any) => {
      const context = this.handleReadFile(item.name)

      item.ast = context

      if (
        !('lang' in context.script) ||
        ('lang' in context.script && context.script.lang !== 'ts') ||
        ('lang' in context.script.attrs && context.script.attrs.lang !== 'ts')
      ) {
        item.scriptAst = babylon.parse(context.script.content, {
          sourceType: 'module'
        })
      }
    })
  }

  /**
   * @name: 读取文件，并编译成 ast
   */
  handleReadFile(path: string): any {
    let res = {}
    let data = null

    try {
      data = fs.readFileSync(path, {
        encoding: 'utf8'
      })
    } catch (error) {
      console.log('handleReadFile:', path, '\n')
      console.log(error)
    }

    if (data) {
      res = compiler.parseComponent(data)
    }

    return res
  }

  /**
   * @name: 生成文件 (parseComponent)
   */
  handleFieldWriteFile(): void {
    if (!this.paths) return

    // 分开写入文件
    const bar = new progress('文件生成中: [:bar] :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: this.paths.length
    })

    this.paths.forEach((v: any) => {
      handleWriteFile({
        path: this.getFilePath(`../json/vueJsToTs/parse/${v.fileName}.json`),
        content: handleDataToString(v)
      })
      bar.tick()
    })

    // handleWriteFile({
    //   path: this.getFilePath('../json/vueJsToTs/parse-vue.json'),
    //   content: handleDataToString(this.paths)
    // })
  }

  getFilePath(v: string): string {
    return path.resolve(__dirname, v)
  }
}

export default ParseVue
