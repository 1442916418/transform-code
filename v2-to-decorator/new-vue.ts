const path = require('path')

import { handleWriteFile, handleDataToString } from '../utils/index'

/**
 * @name：新文件类型
 */
class NewVue {
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
  ast: any
  /**
   * script ts code 代码
   */
  scriptTsCode: any

  constructor(context: any) {
    this.fileName = context.fileName
    this.filePath = context.name
    this.ast = context?.ast ?? ''
    this.scriptTsCode = context?.scriptTsCode ?? ''
  }

  init() {
    this.handleWriteNewVueFile()
  }

  handleWriteNewVueFile() {
    if (!this.fileName || !this.filePath) return

    const content: any = this.getNewFileContent()

    handleWriteFile({
      path: this.getFilePath(`../json/vueJsToTs/newVue1/${this.fileName}`),
      content
    })

    // handleWriteFile({
    //   path: this.filePath,
    //   content
    // })
  }

  /**
   * @name: 获取新文件内容
   */
  getNewFileContent(): string {
    const { template, script, styles } = this.ast

    let stylesContent = ''
    let scriptContent = ''

    if (styles && styles.length) {
      styles.forEach((v: any) => {
        let attr = ''

        if (v.attrs && v.attrs.lang) {
          attr += `lang=\"${v.attrs.lang}\" `
        }

        if (v.attrs && v.attrs.scoped) {
          attr += 'scoped'
        }

        stylesContent += `<style ${attr}>${v.content ? v.content : ''}</style>\n\r`
      })
    }

    if (('lang' in script && script.lang === 'ts') || ('lang' in script.attrs && script.attrs.lang === 'ts')) {
      scriptContent = script.content
    } else {
      scriptContent = this.scriptTsCode
    }

    let result = `<template>${
      template?.content ?? ''
    }</template>\n\r<script lang="ts">${scriptContent}</script>\n\r${stylesContent}`
    // let result = `<script lang="ts">${scriptContent}</script>`

    return result
  }

  getFilePath(v: string): string {
    return path.resolve(__dirname, v)
  }
}

export default NewVue
