/// <reference path="../../types/validation.ts" />

import { TYPES, VUE_OPTIONS } from './constant'
import { setImportCode, setVariableCode, setTsScriptCode } from './template'
import { getSubstringData, setCapitalizeWord } from './utils'
import { handleDataToString } from '../../utils'

/**
 * 翻译成 Ts Class components 写法
 */
class TranslateTs {
  /**
   * 文件名称
   */
  fileName: string
  /**
   * 文件路径
   */
  filePath: any
  /**
   * 源 script 代码
   */
  scriptContent: any
  /**
   * 源 script ast 代码
   */
  program: any
  /**
   * 转换后数据
   */
  result: Validation.VueJsToTsTranslateTemplateOptions
  /**
   * 是否转换成字符串
   */
  isToString: boolean

  constructor(context: any) {
    this.fileName = context.fileName
    this.filePath = context.name
    this.scriptContent = context?.ast?.script?.content ?? ''
    this.program = context?.scriptAst?.program?.body ?? []

    this.result = {
      name: setCapitalizeWord(context.fileName.split('.')[0]),
      componentsOptions: [],
      propsOptions: [],
      dataOptions: [],
      methodsOptions: [],
      computedOptions: [],
      watchOptions: [],
      importOptions: [],
      decoratorOptions: [],
      normalScriptCode: [],
      mixinOptions: [],
      beforeCreateOptions: '',
      createdOptions: '',
      beforeMountOptions: '',
      mountedOptions: '',
      beforeUpdateOptions: '',
      updatedOptions: '',
      beforeDestroyOptions: '',
      destroyedOptions: ''
    }

    this.isToString = false
  }

  init() {
    this.handleProgram()
  }

  /**
   * @name: 处理主入口程序代码
   */
  handleProgram() {
    if (!this.program) return

    this.program.forEach((item: any) => {
      // @ts-ignore
      item.type in TYPES && this[TYPES[item.type]](item)
    })
  }

  /**
   * @name: 处理 export default 代码片段
   * @param item 数据
   */
  handleExportDefaultDeclaration(item: any) {
    const {
      declaration: { type, properties }
    } = item

    if (!properties.length) return

    if (type === 'ObjectExpression') {
      properties.forEach((v: any) => {
        const name = v.key.name

        // @ts-ignore
        name in VUE_OPTIONS && this[VUE_OPTIONS[name]](v)
      })
    }
  }

  /**
   * @name: 处理 Vue data 数据
   * @param item 数据
   */
  handleVueDataOptions(item: any) {
    const {
      key: { name },
      body: { body }
    } = item

    if (name !== 'data' || !body.length) return

    const result: object[] = []
    const scriptContent = this.scriptContent

    body.forEach((bodyItem: any) => {
      const { type, start, end } = bodyItem

      switch (type) {
        case 'VariableDeclaration':
          result.push({
            type: 'VariableDeclaration',
            value: getSubstringData(scriptContent, start, end)
          })
          break
        case 'IfStatement':
          result.push({
            type: 'IfStatement',
            value: getSubstringData(scriptContent, start, end)
          })
          break
        case 'ReturnStatement':
          {
            const list = bodyItem?.argument?.properties ?? []

            list.forEach((t: any) => {
              result.push({
                type: 'ReturnStatement',
                value: getSubstringData(scriptContent, t.start, t.end)
              })
            })
          }
          break
      }
    })

    this.result.dataOptions = result
  }

  /**
   * @name: 处理 Vue props 数据
   * @param item 数据
   */
  handleVuePropsOptions(item: any) {
    const {
      key: { name },
      value: { properties }
    } = item

    if (name !== 'props' || !properties.length) return

    const propsResult: any = []

    properties.forEach((p: any) => {
      const res = {}

      // @ts-ignore
      res[p.key.name] = getSubstringData(this.scriptContent, p.value.start, p.value.end)

      propsResult.push(this.isToString ? handleDataToString(res) : res)
    })

    this.result.propsOptions = propsResult
  }

  /**
   * @name: 处理 Vue computed 数据
   * @param item 数据
   */
  handleVueComputedOptions(item: any) {
    const {
      key: { name },
      value: { properties }
    } = item

    if (name !== 'computed' || !properties.length) return

    const computedResult: string[] = []

    properties.forEach((p: any) => {
      const res: any = {}

      if (p.type === 'ObjectMethod') {
        // @ts-ignore
        res[`get ${p.key.name}`] = getSubstringData(this.scriptContent, p.body.start, p.body.end)
      } else if (p.type === 'SpreadElement') {
        // TODO: 展开运算 mapGetters
        if (p.argument.arguments.length) {
          const { start, end } = p.argument.arguments[0]

          // @ts-ignore
          res[`${p.argument.callee.name}`] = getSubstringData(this.scriptContent, start, end)
        }
      }

      computedResult.push(this.isToString ? handleDataToString(res) : res)
    })

    this.result.computedOptions = computedResult
  }

  /**
   * @name: 处理 Vue watch 数据
   * @param item 数据
   */
  handleVueWatchOptions(item: any) {
    const {
      key: { name },
      value: { properties }
    } = item

    if (name !== 'watch' || !properties.length) return

    const watchResult: any = []

    properties.forEach((p: any) => {
      const res = {}

      if (p.type === 'ObjectProperty') {
        // @ts-ignore
        res[p.key.name] = getSubstringData(this.scriptContent, p.value.start, p.value.end)
      } else if (p.type === 'ObjectMethod') {
        // @ts-ignore
        res[p.key.name] = getSubstringData(this.scriptContent, p.key.end, p.body.end)
      }

      watchResult.push(this.isToString ? handleDataToString(res) : res)
    })

    this.result.watchOptions = watchResult
  }

  /**
   * @name: 处理 Vue methods 数据
   * @param item 数据
   */
  handleVueMethodsOptions(item: any) {
    const {
      key: { name },
      value: { properties }
    } = item

    if (name !== 'methods' || !properties.length) return

    const methodsResult: any = []

    properties.forEach((p: any) => {
      const res = {}

      if (p.type === 'ObjectMethod') {
        // @ts-ignore
        res[p.key.name] = getSubstringData(this.scriptContent, p.key.end, p.body.end)
      }

      methodsResult.push(this.isToString ? handleDataToString(res) : res)
    })

    this.result.methodsOptions = methodsResult
  }

  /**
   * @name: 处理 Vue mixin 数据
   * @param item 数据
   */
  handleVueMixinsOptions(item: any) {
    const {
      key: { name },
      value: { elements }
    } = item

    if (name !== 'mixins' || !elements.length) return

    const mixinResult: string[] = elements.map((p: any) => p.name)

    this.result.mixinOptions = mixinResult
  }

  /**
   * @name: 处理 Vue components 数据
   * @param item 数据
   */
  handleVueComponentsOptions(item: any) {
    const {
      key: { name },
      value: { properties }
    } = item

    if (name !== 'components' || !properties.length) return

    const componentsResult: any = []

    properties.forEach((p: any) => {
      const res = {}

      if (p.type === 'ObjectProperty') {
        // @ts-ignore
        res[p.key.name] = p.value.name
      }

      componentsResult.push(this.isToString ? handleDataToString(res) : res)
    })

    this.result.componentsOptions = componentsResult
  }

  /**
   * @name: 处理 Vue name 数据
   * @param item 数据
   */
  handleVueNameOptions(item: any) {
    const value = item?.value?.value ?? ''

    if (value) {
      this.result.name = setCapitalizeWord(value)
    }
  }

  /**
   * @name: 处理 Vue beforeCreate 数据
   * @param item 数据
   */
  handleVueBeforeCreateOptions(item: any) {
    this.handleVueLifeCycleOptions(item, 'beforeCreate')
  }

  /**
   * @name: 处理 Vue created 数据
   * @param item 数据
   */
  handleVueCreatedOptions(item: any) {
    this.handleVueLifeCycleOptions(item, 'created')
  }

  /**
   * @name: 处理 Vue beforeMount 数据
   * @param item 数据
   */
  handleVueBeforeMountOptions(item: any) {
    this.handleVueLifeCycleOptions(item, 'beforeMount')
  }

  /**
   * @name: 处理 Vue mounted 数据
   * @param item 数据
   */
  handleVueMountedOptions(item: any) {
    this.handleVueLifeCycleOptions(item, 'mounted')
  }

  /**
   * @name: 处理 Vue beforeUpdate 数据
   * @param item 数据
   */
  handleVueBeforeUpdateOptions(item: any) {
    this.handleVueLifeCycleOptions(item, 'beforeUpdate')
  }

  /**
   * @name: 处理 Vue updated 数据
   * @param item 数据
   */
  handleVueUpdatedOptions(item: any) {
    this.handleVueLifeCycleOptions(item, 'updated')
  }

  /**
   * @name: 处理 Vue beforeDestroy 数据
   * @param item 数据
   */
  handleVueBeforeDestroyOptions(item: any) {
    this.handleVueLifeCycleOptions(item, 'beforeDestroy')
  }

  /**
   * @name: 处理 Vue destroyed 数据
   * @param item 数据
   */
  handleVueDestroyedOptions(item: any) {
    this.handleVueLifeCycleOptions(item, 'destroyed')
  }

  /**
   * @name: 处理 Vue 生命周期选项
   * @param list 源数据
   * @param name 类型
   */
  handleVueLifeCycleOptions(item: any, type: string): void {
    const {
      key: { name },
      body: { body }
    } = item

    if (name !== type || !body.length) return

    const result: string = getSubstringData(this.scriptContent, item.key.end, item.body.end)

    // @ts-ignore
    this.result[`${type}Options`] = result
  }

  /**
   * @name: 处理 import 代码片段
   * @param item 数据
   */
  handleImportDeclaration(item: any) {
    const { specifiers, source } = item

    let specifiersRes = undefined
    let sourceRes = source?.value ?? ''

    if (specifiers.length) {
      const type = specifiers[0].type

      if (type === 'ImportDefaultSpecifier') {
        specifiersRes = specifiers[0].local.name || ''
      } else if (type === 'ImportSpecifier') {
        specifiersRes = specifiers.map((v: any) => v.local.name)
      }
    }

    this.result.importOptions.push(setImportCode(specifiersRes, sourceRes))
  }

  /**
   * @name: 处理默认导出前变量变量代码片段
   * @param item 数据
   */
  handleVariableDeclaration(item: any) {
    const { declarations, kind } = item
    const {
      id: { name },
      init: { type, properties }
    } = declarations[0]

    let content: object = {}

    if (type === 'ObjectExpression' && properties.length) {
      properties.forEach((v: any) => {
        const key = v.key.name
        let value: string | object = ''

        if (v.value.type === 'StringLiteral') {
          value = v.value.value
        } else if (v.value.type === 'ObjectExpression') {
          const objectValue = {}

          v.value.properties.forEach((f: any) => {
            // @ts-ignore
            objectValue[f.key.name] = f.value.value
          })

          value = objectValue
        }

        // @ts-ignore
        content[key] = value
      })
    }

    this.result.normalScriptCode.push(setVariableCode(kind, name, content))
  }

  /**
   * @name: 结果
   * @returns script ts code
   */
  getResult() {
    return setTsScriptCode(this.result)
  }
}

export default TranslateTs
