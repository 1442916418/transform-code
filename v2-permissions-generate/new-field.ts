/// <reference path="../types/validation.ts" />

import fs from 'fs'
import { elButton, elTable, elButtonAuth, elTableNewAuth, elTableOldAuth } from '../constant'

const cloneDeep = require('loadsh/cloneDeep')

/**
 * @name: 处理源授权数据
 */
class NewField {
  /**
   * @name: 源文件数据
   */
  ast: Validation.parseComponentOptions['ast']
  /**
   * @name: 源文件读取的原授权信息
   */
  authInfo: object[]
  /**
   * @name: 源文件绝对路径
   */
  filePath: string
  /**
   * @name: 英文数据
   */
  englishData: object[]

  constructor(options: Validation.parseComponentOptions, englishData: object[]) {
    this.ast = options.ast
    this.authInfo = options.authInfo
    this.filePath = options.componentPath || options.path
    this.englishData = englishData
  }

  init(): void {
    this.handleAuthInfo()
    this.handleWriteNewVueFile()
  }

  /**
   * @name: 处理授权信息
   */
  handleAuthInfo() {
    if (!this.authInfo) return

    let template = cloneDeep(this.ast.template.content)

    if (!template) return

    let authInfo = this.authInfo
    let addLen = 0 // 增加的字符串长度

    for (let i = 0; i < authInfo.length; i++) {
      const t: any = authInfo[i]
      let curStart = addLen ? t.start + addLen : t.start
      let curEnd = addLen ? t.end + addLen : t.end

      if (t.lowerCasedTag === elButton && !t.isElButtonAuth) {
        const { ele, len } = this.handleNewElButton({ template, start: curStart, end: curEnd, text: t.text })

        addLen += len

        template = this.handleReplaceString({ start: curStart, end: curEnd, data: ele, str: template })
      }

      // if (t.lowerCasedTag === elTable && !t.isElTableNewAuth) {
      //   const { ele, len } = this.handleNewElTable({ template, start: curStart, end: curEnd, text: t.text })

      //   addLen += len

      //   template = this.handleReplaceString({ start: curStart, end: curEnd, data: ele, str: template })
      // }
    }

    this.ast.template.newContent = template
  }

  /**
   * @name: 获取新 el-table 标签
   * @description: 添加指令并返回
   * @param {object} v 数据
   * @return {object} 新标签
   */
  handleNewElTable(v: { template: string; start: number; end: number; text: string }): { ele: string; len: number } {
    const str = v.template.substring(v.start, v.end)
    const insertInstruction = ` ${elTableNewAuth}`

    const result = this.handleSpliceInstruction({ start: str.lastIndexOf('>'), insertInstruction, str })

    return { ele: result, len: insertInstruction.length }
  }

  /**
   * @name: 获取新 el-button 标签
   * @description: 添加指令并返回
   * @param {object} v 数据
   * @return {object} 新标签
   */
  handleNewElButton(v: { template: string; start: number; end: number; text: string }): { ele: string; len: number } {
    const str = v.template.substring(v.start, v.end)
    const insertInstruction = ` ${elButtonAuth}=\"'${this.getTranslateText(v.text)}'\"`

    const result = this.handleSpliceInstruction({ start: str.lastIndexOf('>'), insertInstruction, str })

    return { ele: result, len: insertInstruction.length }
  }

  /**
   * @name: 替换
   * @description: 在源数据中替换新标签
   * @param {object} v 数据
   * @return {string} 新源数据
   */
  handleReplaceString(v: { start: number; end: number; data: string; str: string }): string {
    return `${v.str.slice(0, v.start)}${v.data}${v.str.slice(v.end, v.str.length)}`
  }

  /**
   * @name: 拼接指令
   * @description: 字符串最后一位之前拼接指令
   * @param {object} v 数据
   * @return {string} 拼接好的数据
   */
  handleSpliceInstruction(v: { start: number; insertInstruction: string; str: string }): string {
    return `${v.str.slice(0, v.start)}${v.insertInstruction}${v.str.slice(v.start)}`
  }

  /**
   * @name: 获取翻译文本
   * @description: 中文 to 英文
   */
  getTranslateText(text: string): string {
    if (!this.englishData) return text

    let find: any = this.englishData.find((v: any) => v.label === text)

    return find ? find.value : text
  }

  /**
   * @name: 写入新文件
   */
  handleWriteNewVueFile(): void {
    if (!this.filePath) return

    let content: any = this.getNewFileContent()

    try {
      fs.open(this.filePath, 'w+', function (err, fd) {
        if (err) {
          console.error(err)
          return
        } else {
          fs.write(fd, content, 0, 'utf-8', function (err, written, buffer) {
            if (err) {
              console.log('写入文件失败')
              console.log(err)
            }
          })
        }
      })
    } catch (error) {
      console.log('new-field handleWriteNewVueFile row: 224')
      console.log(error)
    }
  }

  /**
   * @name: 获取新文件内容
   */
  getNewFileContent(): string {
    const { template, script, styles } = this.ast

    let stylesContent = ''

    if (styles && styles.length) {
      styles.forEach((v) => {
        let atts = ''

        if (v.attrs && v.attrs.lang) {
          atts += `lang=\"${v.attrs.lang}\" `
        }

        if (v.attrs && v.attrs.scoped) {
          atts += 'scoped'
        }

        stylesContent += `<style ${atts}>${v.content ? v.content : ''}</style>\n\r`
      })
    }

    let result = `<template>${template && template.newContent ? template.newContent : ''}</template>\n\r<script>${
      script && script.content ? script.content : ''
    }</script>\n\r${stylesContent}`

    return result
  }
}

export default NewField
