/// <reference path="../types/validation.ts" />

import progress from 'progress'

const compiler = require('vue-template-compiler')
const babylon = require('@babel/parser')
const traverse = require('@babel/traverse').default
const { camelCase, toLower } = require('loadsh')

import fs from 'fs'
import path from 'path'

import Field from './field'
import NewField from './new-field'
import Translate from './translate'

import { handleWriteFile, handleDataToString } from '../utils/index'
import { dynamicComponent, dynamicComponentInstanceKeyList } from '../constant'

interface options {
  paths: object[]
  isJson?: boolean
  basePath: string
}

/**
 * @name: 获取授权字段
 * @description: 根据路由路径提取权限字段
 * @return {Array} data 权限字段
 */
class Auth {
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
    this.handleTranslate()

    setTimeout(() => {
      this.handleNewField()
      this.isJson && this.handleFieldWriteFile()
    }, 3000)
  }

  /**
   * @name: 处理授权字段
   * @description: 处理源数据文件内容，增加新授权指令（必须等翻译之后）
   */
  handleNewField(): void {
    if (!this.paths) return

    const englishData = Translate.getTranslateEnData()

    const handleData = (itemData: any) => {
      if (!itemData.isLayout && itemData.ast && itemData.authInfo && itemData.componentPath) {
        const newField = new NewField(itemData, englishData)
        newField.init()

        if (itemData.isDynamicComponent && itemData.dynamicComponentAst) {
          itemData.dynamicComponentAst.forEach((v: any) => {
            const newField = new NewField(v, englishData)
            newField.init()
          })
        }
      }

      if (itemData.children && itemData.children.length) {
        itemData.children.forEach((v: any) => {
          handleData(v)
        })
      }
    }

    this.paths.forEach((item: any) => {
      handleData(item)
    })
  }

  /**
   * @name: 翻译
   * @description 翻译源授权数据里的 el-button 文本，中文转英文
   */
  handleTranslate(): void {
    Translate.handleCollectChineseData(this.paths)
    Translate.handleChineseDataToEnglish(this.isJson)
  }

  /**
   * @name: 获取源文件
   * @description 获取源文件内容，并解析得到源授权数据
   */
  handleReadFileAstData(): void {
    if (!this.paths) return

    const handleData = (itemData: any) => {
      if (!itemData.isLayout && 'hidden' in itemData && !itemData.hidden && itemData.componentPath) {
        const curFileContent = this.handleReadFile(itemData.componentPath)
        const dynamicComponentFileContent = this.handleDynamicComponent(curFileContent, itemData.componentPath)

        itemData.ast = curFileContent
        itemData.authInfo = this.handleAstFieldData([curFileContent])

        if (dynamicComponentFileContent && dynamicComponentFileContent.length) {
          dynamicComponentFileContent.forEach((v: any) => {
            const dynamicComponentFileContent = this.handleReadFile(v.path)
            v.ast = dynamicComponentFileContent
            v.authInfo = this.handleAstFieldData([dynamicComponentFileContent])
          })

          itemData.isDynamicComponent = true
          itemData.dynamicComponentAst = dynamicComponentFileContent
        } else {
          itemData.isDynamicComponent = false
        }
      }

      if (itemData.children && itemData.children.length) {
        itemData.children.forEach((v: any) => {
          handleData(v)
        })
      }
    }

    this.paths.forEach((item: any) => {
      handleData(item)
    })
  }

  /**
   * @name: 判断是否是动态组件页面
   * @param {Validation} fileContent 当前页面内容
   * @param {string} curPath 当前绝对页面路径
   * @return {array} 绝对路径等信息
   */
  handleDynamicComponent(fileContent: Validation.parseComponentOptions['ast'], curPath: string): object[] {
    if (!fileContent || !fileContent.template || !fileContent.template.content) {
      return []
    }

    const tag = `\<${dynamicComponent}`
    const dynamicComponentTag = new RegExp(tag, 'g')

    if (!dynamicComponentTag.test(fileContent.template.content)) {
      return []
    }

    if (!fileContent || !fileContent.script || !fileContent.script.content) {
      return []
    }

    const scriptContent = fileContent.script.content
    const importList: object[] = []
    const componentList: string[] = []
    const matchResult: object[] = []

    const ast = babylon.parse(scriptContent, {
      sourceType: 'module'
    })

    traverse(ast, {
      ImportDeclaration(path: { node: { specifiers: any; source: { value: any } } }) {
        const specifiers = path.node.specifiers
        const value = path.node.source.value
        let names: string[] = []

        specifiers.forEach((v: any) => {
          names.push(v.local.name)
        })

        importList.push({
          names,
          value
        })
      },
      ObjectProperty(path: { node: { key: { name: any }; value: { elements: any } } }) {
        const key = path.node.key.name

        if (dynamicComponentInstanceKeyList.includes(key)) {
          const value: any = path.node.value

          if (value && value.type === 'ArrayExpression') {
            const elements = path.node.value.elements

            if (elements && elements.length) {
              elements.forEach((item: any) => {
                componentList.push(item.value)
              })
            }
          }
        }
      }
    })

    if (componentList && importList) {
      componentList.forEach((com: any) => {
        const comName = toLower(camelCase(com))

        importList.forEach((v: any) => {
          v.names.forEach((n: string) => {
            const importName = toLower(camelCase(n))
            if (comName === importName) {
              const path = this.handelDynamicComponentPath(v.value, curPath)
              matchResult.push({
                name: com,
                url: com,
                path,
                ast: this.handleReadFile(path)
              })
            }
          })
        })
      })
    }

    return matchResult
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
   * @name: 获取授权字段
   * @param {object} item fileContentAstList
   */
  handleAstFieldData(fileContentAstList: object[]): object[] {
    const newField = new Field(fileContentAstList)
    newField.init()

    return newField.authInfo
  }

  /**
   * @name: 生成文件 (parseComponent)
   */
  handleFieldWriteFile(): void {
    if (!this.paths) return

    // 分开写入文件
    // const bar = new progress('权限字段文件生成中: [:bar] :percent :etas', {
    //   complete: '=',
    //   incomplete: ' ',
    //   width: 20,
    //   total: this.paths.length
    // })

    // this.paths.forEach((v: any) => {
    //   const name = v.meta && v.meta.title ? v.meta.title : v.name

    //   handleWriteFile({
    //     path: this.getFilePath(`../json/generate/${name}-tree-field-${v.currentIndex}.json`),
    //     content: handleDataToString(v)
    //   })
    //   bar.tick()
    // })

    handleWriteFile({
      path: this.getFilePath('../json/generate/tree-route-field-list.json'),
      content: handleDataToString(this.paths)
    })
  }

  getFilePath(v: string): string {
    return path.resolve(__dirname, v)
  }

  handelDynamicComponentPath(url: string, curPath: string) {
    let newPath: string = ''

    if (url.includes('@')) {
      newPath = `${this.basePath}src\\${path.join(url.slice(2))}`
    } else {
      let tab = url.substring(0, 2)
      const reg = /\.{1,2}\//gi

      if (tab === './') {
        newPath = `${curPath.split('\\').slice(0, -1).join('\\')}\\${url.replace(reg, '')}`
      } else {
        let lastUrl = url.replace(reg, '')
        let len = url.split('/').length - lastUrl.split('/').length
        let cur = curPath.split('\\').slice(0, -1)

        newPath = `${len ? cur.slice(0, -len).join('\\') : cur.join('\\')}${url.replace(reg, '')}`
      }
    }

    return newPath
  }
}

export default Auth
