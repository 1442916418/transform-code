/// <reference path="../types/validation.ts" />

import progress from 'progress'

const compiler = require('vue-template-compiler')
const babylon = require('@babel/parser')
const traverse = require('@babel/traverse').default
const { camelCase, toLower } = require('loadsh')

import fs from 'fs'
import path from 'path'

import Field from './field'
import GenerateMarkdown from './generate-md'

import { handleWriteFile, handleDataToString, isFileExist } from '../utils/index'
import { dynamicComponent, dynamicComponentInstanceKeyList } from '../constant'

interface options {
  paths: object[]
  isJson?: boolean
  basePath: string
  docsBasePath?: string
}

/**
 * @name: 读取模块页面基础信息
 * @description: 根据路由路径提取筛选条件、操作按钮、数据展示字段、数据展示功能操作
 */
class Read {
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
   * @name: md 文件存放目录
   */
  docsBasePath?: string

  constructor(options: options) {
    this.paths = options.paths
    this.isJson = options.isJson
    this.basePath = options.basePath
    this.docsBasePath = options.docsBasePath
  }

  init(): void {
    this.handleReadFileAstData()
    this.handleGenerateMarkdown()

    this.isJson && this.handleFieldWriteFile()
  }

  /**
   * @name：生成 markdown
   */
  handleGenerateMarkdown() {
    if (!this.paths) return

    let firstPathName = ''

    const handleData = (itemData: any) => {
      if (!itemData.isLayout && 'hidden' in itemData.meta && !itemData.meta.hidden && itemData.componentPath) {
        const newGenerateMarkdown = new GenerateMarkdown({
          item: itemData,
          isJson: this.isJson,
          basePath: this.basePath,
          docsBasePath: `${this.docsBasePath}${path.sep}${firstPathName}`
        })

        newGenerateMarkdown.init()
      }

      if (itemData.children && itemData.children.length) {
        itemData.children.forEach((v: any) => {
          this.handleMarkdownFolder(`${firstPathName}${path.sep}${v.name}`)
          handleData(v)
        })
      }
    }

    this.paths.forEach((item: any) => {
      firstPathName = item.name

      this.handleMarkdownFolder(firstPathName)

      handleWriteFile({
        path: `${this.docsBasePath}${path.sep}${firstPathName}${path.sep}README.md`,
        content: `# ${item.meta.title}主页\n`
      })

      handleData(item)
    })
  }

  /**
   * @name：判断是否需要生成文件夹
   * @param item 文件夹名称
   */
  handleMarkdownFolder(name: string) {
    const fileDir = `${this.docsBasePath}${path.sep}${name}`

    if (fileDir && !isFileExist(fileDir)) {
      fs.mkdirSync(fileDir)
    }
  }

  /**
   * @name: 获取源文件
   * @description 获取源文件内容，并解析得到源数据
   */
  handleReadFileAstData(): void {
    if (!this.paths) return

    const handleData = (itemData: any) => {
      if (!itemData.isLayout && 'hidden' in itemData.meta && !itemData.meta.hidden && itemData.componentPath) {
        const curFileContent = this.handleReadFile(itemData.componentPath)
        const dynamicComponentFileContent = this.handleDynamicComponent(curFileContent, itemData.componentPath)

        itemData.ast = curFileContent
        itemData.result = this.handleAstFieldData([curFileContent])

        if (dynamicComponentFileContent && dynamicComponentFileContent.length) {
          dynamicComponentFileContent.forEach((v: any) => {
            const dynamicComponentFileContent = this.handleReadFile(v.path)
            v.ast = dynamicComponentFileContent
            v.result = this.handleAstFieldData([dynamicComponentFileContent])
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
  handleAstFieldData(fileContentAstList: object[]): object {
    const newField = new Field(fileContentAstList)
    newField.init()

    return newField.result
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
    //     path: this.getFilePath(`../json/docs/${name}-tree-field-${v.currentIndex}.json`),
    //     content: handleDataToString(v)
    //   })
    //   bar.tick()
    // })

    handleWriteFile({
      path: this.getFilePath('../json/docs/tree-route-field-list.json'),
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

export default Read
