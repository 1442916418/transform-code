/// <reference path="../types/validation.ts" />

import progress from 'progress'

const compiler = require('vue-template-compiler')
const babylon = require('@babel/parser')
const traverse = require('@babel/traverse').default
const { camelCase, toLower, uniqBy } = require('loadsh')

import fs from 'fs'
import path from 'path'

import Field from './field'
import GenerateXlsx from './generate-xlsx'

import { handleWriteFile, handleDataToString } from '../utils/index'
import { dynamicComponent, dynamicComponentInstanceKeyList } from '../constant'

interface options {
  token?: string
  baseUrl?: string
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
  /**
   * @name: travel-admin-web 项目接口地址
   */
  baseUrl?: string
  /**
   * @name: travel-admin-web 项目登录 token
   */
  token?: string

  constructor(options: options) {
    this.paths = options.paths // 需要读取的路由
    this.isJson = options.isJson // 是否生成文件
    this.basePath = options.basePath // 是否生成文件

    this.baseUrl = options.baseUrl
    this.token = options.token
  }

  init(): void {
    this.handleReadFileAstData()
    this.handleAstData()

    this.isJson && this.handleFieldWriteFile()

    // const generateXlsx = new GenerateXlsx(this.paths, this.baseUrl, this.token, this.isJson)
    // generateXlsx.init()
  }

  getFilePath(v: string): string {
    return path.resolve(__dirname, v)
  }

  /**
   * @name: 获取 ast 数据
   */
  handleReadFileAstData(): void {
    if (!this.paths || !this.paths.length) return

    const handleData = (itemData: any): void => {
      if (!itemData.isLayout && 'hidden' in itemData && !itemData.hidden && itemData.componentPath) {
        const { templateAst, parseComponent } = this.handleReadFile(itemData.componentPath)

        itemData.ast = templateAst
        itemData.parseComponent = parseComponent

        const dynamicComponentFileContent = this.handleDynamicComponent(parseComponent, itemData.componentPath)

        if (dynamicComponentFileContent && dynamicComponentFileContent.length) {
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
              const { templateAst, parseComponent } = this.handleReadFile(path)
              matchResult.push({
                name: com,
                url: com,
                path,
                ast: templateAst,
                parseComponent
              })
            }
          })
        })
      })
    }

    return matchResult
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

  /**
   * @name: 读取文件，并编译成 ast
   */
  handleReadFile(path: string): { templateAst: object; parseComponent: Validation.parseComponentOptions['ast'] } {
    let templateAst = {}
    let parseComponent: any = {}
    let data = null

    try {
      data = fs.readFileSync(path, {
        encoding: 'utf8'
      })
    } catch (error) {
      console.log('class auth handleReadFile row:226 \n')
      console.log(path)
      console.log(error)
    }

    if (data) {
      parseComponent = compiler.parseComponent(data)

      if (parseComponent && parseComponent.template && parseComponent.template.content) {
        templateAst = compiler.compile(parseComponent.template.content)
      }
    }

    return { templateAst, parseComponent }
  }

  /**
   * @name: 处理 ast 数据
   * @description: 根据 ast 提取权限字段
   */
  handleAstData(): void {
    if (!this.paths) return

    const handleData = (itemData: any) => {
      if ('ast' in itemData) {
        let fieldResult = this.handleTraverseAstData(itemData.ast.ast)

        if (itemData.isDynamicComponent && itemData.dynamicComponentAst) {
          itemData.dynamicComponentAst.forEach((v: any) => {
            const dynamicComponentField = this.handleTraverseAstData(v.ast.ast)

            dynamicComponentField && dynamicComponentField.length && fieldResult.push(...dynamicComponentField)
          })
        }

        itemData.field = fieldResult && fieldResult.length ? uniqBy(fieldResult, 'elementValue') : []
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
   * @name: 获取授权字段
   * @param {Object} item 路径及 ast 数据
   * @return {Object} 权限数据
   */
  handleTraverseAstData(ast: Validation.parseComponentOptions['ast']): object[] {
    const newField = new Field(ast)
    newField.init()

    return newField.getResult()
  }

  /**
   * @name: 生成文件
   */
  handleFieldWriteFile(): void {
    if (!this.paths) return

    // 分开写入文件
    // const bar = new progress('读取权限字段文件生成中: [:bar] :percent :etas', {
    //   complete: '=',
    //   incomplete: ' ',
    //   width: 20,
    //   total: this.paths.length
    // })

    // this.paths.forEach((v: any) => {
    //   handleWriteFile({
    //     path: this.getFilePath(`../json/read/${v.name}-${v.isDynamicComponent ? dynamicComponent : ''}-field-${v.index}.json`),
    //     content: handleDataToString(v, ['ast', 'parseComponent'])
    //   })
    //   bar.tick()
    // })

    handleWriteFile({
      path: this.getFilePath('../json/read/tree-route-field-list.json'),
      content: handleDataToString(this.paths, ['ast', 'parseComponent'])
    })
  }
}

export default Auth
