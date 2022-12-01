/// <reference path="../../../types/validation.ts" />

const { isArray, isEmpty, camelCase } = require('loadsh')

import { handleDataToString } from '../../../utils'
import { setCapitalizeWord } from '../utils'

/**
 * @name: 设置 ts 代码
 */
export const setTsScriptCode = (options: Validation.VueJsToTsTranslateTemplateOptions) => {
  const {
    name = '',
    componentsOptions = [],
    propsOptions = [],
    dataOptions = [],
    methodsOptions = [],
    computedOptions = [],
    watchOptions = [],
    importOptions = [],
    normalScriptCode = [],
    mixinOptions = []
  } = options

  // const result = `${handleDataToString(options)}`

  const { dataVarData, dataReturnData } = getDataOptionsCode(dataOptions)
  const mixinOptionsCode = getMixinOptionsCode(mixinOptions)
  const componentsOptionsCode = getComponentsOptionsCode(componentsOptions)
  const vueLifeCycleOptionsCode = handleVueLifeCycleOptionsCode(options)

  const result = `
import { Vue, Component${getDecoratorOptions(options)}} from 'vue-property-decorator'
${importOptions.length ? importOptions.join('\n') + '\n' : ''}
${normalScriptCode.length ? normalScriptCode.join('\n') + '\n' : ''}
${dataVarData.length ? dataVarData.join('\n') : ''}

@Component({
  ${componentsOptionsCode}${componentsOptionsCode && mixinOptionsCode ? ',' : ''}
  ${mixinOptionsCode}${mixinOptionsCode && vueLifeCycleOptionsCode ? ',' : ''}
  ${vueLifeCycleOptionsCode}
})
export default class ${name} extends Vue {
  ${getPropsOptionsCode(propsOptions)}
  
  ${dataReturnData.length ? dataReturnData.join('\n') : ''}
  
  ${getComputedOptionsCode(computedOptions)}
  
  ${getWatchOptionsCode(watchOptions)}
  
  ${getMethodsOptionsCode(methodsOptions)}
}
`

  // const _result = result.replace(/\s{1}\n\s{1}/gi, '')

  return result
}

/**
 * @name: 处理 methods
 * @param data 源数据
 * @returns methods 数据
 */
export const getMethodsOptionsCode = (data: object[] | string[]): string => {
  if (!data) return ''

  const result: string[] = []

  data.forEach((item: any) => {
    let res = ''
    for (let key in item) {
      const value = item[key]
      res = `${value.includes('await') ? 'async ' : ''}${key} ${value}`
    }

    result.push(res)
  })

  return result.join('\n')
}

/**
 * @name: 处理 watch
 * @param data 源数据
 * @returns watch 数据
 */
export const getWatchOptionsCode = (data: object[] | string[]): string => {
  if (!data) return ''

  const result: string[] = []

  data.forEach((item: any) => {
    let res = ''

    for (let key in item) {
      const value = item[key]

      if (value.includes('function')) {
        const option: { deep?: boolean; immediate?: boolean } = {}

        if (value.includes('deep')) {
          option.deep = true
        }
        if (value.includes('immediate')) {
          option.immediate = true
        }

        let body = value
          .substring(value.indexOf('function'), value.lastIndexOf('}'))
          .replace(/function/, `watch${setCapitalizeWord(key)}`)

        res = `@Watch('${key}'${!isEmpty(option) ? `, ${handleDataToString(option)}` : ''}) \n${body}`
      } else {
        res = `// TODO: watch function\n@Watch('${key}') \n${item[key]}`
      }
    }

    result.push(res)
  })

  return result.join('\n')
}

/**
 * @name: 处理 computed
 * @param data 源数据
 * @returns computed 数据
 */
export const getComputedOptionsCode = (data: object[] | string[]): string => {
  if (!data) return ''

  const result: string[] = []

  data.forEach((item: any) => {
    let res = ''
    for (let key in item) {
      res = `${key === 'mapGetters' ? '// TODO: mapGetters \n' : ''}${key}() ${item[key]}`
    }

    result.push(res)
  })

  return result.join('\n')
}

/**
 * @name: 处理 props
 * @param data 源数据
 * @returns props 数据
 */
export const getPropsOptionsCode = (data: object[] | string[]): string => {
  if (!data) return ''

  const result: string[] = []

  data.forEach((item: any) => {
    let res = ''
    for (let key in item) {
      const value = item[key]
      const type = value.substring(value.indexOf(':'), value.indexOf(','))

      res = `@Prop(${value}) ${key}!:${camelCase(type)}`
    }

    result.push(res)
  })

  return result.join('\n')
}

/**
 * @name: 处理 Vue 生命周期
 * @param options 源数据
 * @returns 生命周期声明
 */
export const handleVueLifeCycleOptionsCode = (options: Validation.VueJsToTsTranslateTemplateOptions): string => {
  const {
    beforeCreateOptions = '',
    createdOptions = '',
    beforeMountOptions = '',
    mountedOptions = '',
    beforeUpdateOptions = '',
    updatedOptions = '',
    beforeDestroyOptions = '',
    destroyedOptions = ''
  } = options

  const result = []

  const getTypeName = (v: string): string => v.slice(0, -7)

  if (beforeCreateOptions) {
    result.push(`${getTypeName('beforeCreateOptions')}${beforeCreateOptions}`)
  }
  if (createdOptions) {
    result.push(`${getTypeName('createdOptions')}${createdOptions}`)
  }
  if (beforeMountOptions) {
    result.push(`${getTypeName('beforeMountOptions')}${beforeMountOptions}`)
  }
  if (mountedOptions) {
    result.push(`${getTypeName('mountedOptions')}${mountedOptions}`)
  }
  if (beforeUpdateOptions) {
    result.push(`${getTypeName('beforeUpdateOptions')}${beforeUpdateOptions}`)
  }
  if (updatedOptions) {
    result.push(`${getTypeName('updatedOptions')}${updatedOptions}`)
  }
  if (beforeDestroyOptions) {
    result.push(`${getTypeName('beforeDestroyOptions')}${beforeDestroyOptions}`)
  }
  if (destroyedOptions) {
    result.push(`${getTypeName('destroyedOptions')}${destroyedOptions}`)
  }

  return result.length ? result.join(',\n') : ''
}

/**
 * @name: 处理 mixins 选项
 * @param data 源数据
 * @returns mixins 声明
 */
export const getMixinOptionsCode = (data: string[]): string => {
  if (!data.length) return ''

  const result: string[] = data

  return `mixins: [ ${result.join(',')} ]`
}
/**
 * @name: 处理 components 选项
 * @param data 源数据
 * @returns 组件声明
 */
export const getComponentsOptionsCode = (data: object[] | string[]): string => {
  if (!data) return ''

  const result: string[] = []

  data.forEach((item: any) => {
    for (let key in item) {
      if (key === item[key]) {
        result.push(key)
      } else {
        result.push(`${key}: ${item[key]}`)
      }
    }
  })

  return result.length ? `components: {\n${result.join(',\n')}\n}` : ''
}

/**
 * @name: 处理 data 选项
 * @param data 源数据
 * @returns dataVarData：普通变量, dataReturnData：Vue data 选项
 */
export const getDataOptionsCode = (data: object[]): { dataVarData: string[]; dataReturnData: string[] } => {
  let dataVarData: string[] = []
  let dataReturnData: string[] = []

  if (!data.length) return { dataVarData, dataReturnData }

  const ReturnStatement = 'ReturnStatement'

  const filter0: object[] = data.filter((v: any) => v.type !== ReturnStatement)
  const filter1: object[] = data.filter((v: any) => v.type === ReturnStatement)

  dataVarData = filter0.length ? filter0.map((v: any) => v.value) : []
  dataReturnData = filter1.length ? filter1.map((v: any) => v.value.replace(/:/, '=')) : []

  return { dataVarData, dataReturnData }
}

/**
 * @name：获取装饰选项
 * @param options 源选项
 * @returns 装饰选项
 */
export const getDecoratorOptions = (options: Validation.VueJsToTsTranslateTemplateOptions): string => {
  const { propsOptions = [], watchOptions = [] } = options

  let result = ''

  if (!isEmpty(propsOptions)) {
    result += ', Prop'
  }
  if (!isEmpty(watchOptions)) {
    result += ', Watch'
  }

  return result
}

/**
 * @name: 拼接 import 语句
 * @param specifiers 说明符
 * @param source 来源
 * @returns 数据
 */
export const setImportCode = (specifiers: undefined | string | string[], source: string): string => {
  let result = 'import '

  if (specifiers && typeof specifiers === 'string') {
    result += `${specifiers} from `
  } else if (specifiers && isArray(specifiers)) {
    result += `{ ${specifiers.toString()} } from `
  }

  if (source) {
    result += `'${source}'`
  }

  return result
}

/**
 * @name: 拼接变量语句
 * @param kind 种类
 * @param name 名称
 * @param content 内容
 */
export const setVariableCode = (kind: string, name: string, content: object): string => {
  return `${kind} ${name} = ${handleDataToString(content)}`
}
