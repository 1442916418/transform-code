import path from 'path'

import { handleVueConfig } from '$types-v3'

import plugins from './plugins'
import { PLUGINS_LIST } from '../constant'
import { handleWriteFile, handleDataToString } from '@tools'

import prettier from 'prettier'
import { parse } from '@babel/parser'
import k from '@babel/core'

const compiler = require('vue-template-compiler')
const babel = require('@babel/core')

const log = console.log
const getFilePath = (v: string): string => path.resolve(__dirname, v)

const prettierCode = (code: string, parser: 'vue' | 'typescript') => {
  return prettier.format(code, {
    trailingComma: 'none',
    printWidth: 120,
    tabWidth: 2,
    useTabs: false,
    semi: false,
    singleQuote: true,
    bracketSpacing: true,
    parser
  })
}

/**
 * @name: 获取新文件内容
 */
const getNewFileContent = (SFC: any, scriptCode: string) => {
  return prettierCode(`<script lang="ts" setup>\n${scriptCode || ''}\n</script>`, 'vue')

  // const { template, styles } = SFC

  // let stylesContent = ''

  // if (styles && styles.length) {
  //   styles.forEach((v: any) => {
  //     let attrs = ''

  //     if (v.attrs && v.attrs.lang) {
  //       attrs += `lang=\"${v.attrs.lang}\" `
  //     }

  //     if (v.attrs && v.attrs.scoped) {
  //       attrs += 'scoped'
  //     }

  //     stylesContent += `<style ${attrs}>${v.content ? v.content : ''}</style>\n\r`
  //   })
  // }

  // return `<template>${template.content || ''}</template>\n\r<script lang="ts" setup>${
  //   scriptCode || ''
  // }</script>\n\r${stylesContent}`
}

/**
 * 打印未处理之前的 Script AST
 * @param scriptContent 源数据
 * @param srcFilePath 原路径
 */
const handlePrintScriptAst = (scriptContent: string, srcFilePath: string) => {
  try {
    const scriptAst = parse(scriptContent, {
      sourceType: 'module',
      plugins: PLUGINS_LIST as any
    })

    if (scriptAst) {
      const name = srcFilePath.split(path.sep)

      handleWriteFile({
        path: getFilePath(`../../json/vue3/${name[name.length - 1]}.json`),
        content: handleDataToString(scriptAst)
      })
    }
  } catch (error) {
    log(error)
  }
}

/**
 * 处理 vue 转换
 * @param sourceCode 源文件内容
 * @param config 基础配置
 */
const init = (sourceCode: string, config: handleVueConfig) => {
  const SFC = compiler.parseComponent(sourceCode)
  const scriptContent = SFC?.script?.content ?? ''

  // handlePrintScriptAst(scriptContent, config.srcFilePath)

  try {
    const result = babel.transformSync(scriptContent, {
      parserOpts: {
        sourceType: 'module',
        plugins: PLUGINS_LIST
      },
      plugins
    })

    return getNewFileContent(SFC, result && result.code ? result.code : '')
  } catch (error) {
    console.error('handle vue error: ', error)
    return ''
  }
}

export default init
