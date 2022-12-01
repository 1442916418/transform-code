/// <reference path="../types/validation.ts" />

import ParseHtml from './parse-html'

/**
 * @name: 获取源数据信息
 */
class Field {
  /**
   * @name: 文件内容 ast
   */
  fileContentAstList: object[]
  /**
   * @name: 信息
   */
  result: object

  constructor(fileContentAstList: object[]) {
    this.fileContentAstList = fileContentAstList
    this.result = {}
  }

  init(): void {
    this.handleAstTemplateAuthInfo()
  }

  /**
   * @name: 处理 ast template 获取源授权信息
   */
  handleAstTemplateAuthInfo(): void {
    if (!this.fileContentAstList || !this.fileContentAstList.length) return

    this.fileContentAstList.forEach((ast: any) => {
      const newParseHtml = new ParseHtml(ast.template.content)
      newParseHtml.init()

      this.result = newParseHtml.result
    })
  }
}

export default Field
