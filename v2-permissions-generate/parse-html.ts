// @ts-nocheck

import {
  elButton,
  elTable,
  elElement,
  dynamicComponent,
  elButtonAuth,
  elTableNewAuth,
  elTableOldAuth
} from '../constant'

const comment = /^<!\--/
const conditionalComment = /^<!\[/
const unicodeRegExp =
  /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)
const startTagOpen = new RegExp(`^<${qnameCapture}`)
const startTagClose = /^\s*(\/?)>/
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const dynamicArgAttribute =
  /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+?\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/

export default class ParseHtml {
  private html: string
  private index: number
  private last: string
  public startTagList: never[]

  constructor(content: string) {
    this.html = content
    this.index = 0
    this.startTagList = []
    this.last = ''
  }

  init(): void {
    this.handleHtml()
  }

  handleHtml(): void {
    if (!this.html) return

    while (this.html) {
      this.last = this.html

      let textEnd = this.html.indexOf('<')

      if (textEnd === 0) {
        // 是否有注释
        if (comment.test(this.html)) {
          const commentEnd = this.html.indexOf('-->')

          if (commentEnd >= 0) {
            this.advance(commentEnd + 3)
            continue
          }
        }

        // 有条件的注释
        if (conditionalComment.test(this.html)) {
          const conditionalEnd = this.html.indexOf(']>')

          if (conditionalEnd >= 0) {
            this.advance(conditionalEnd + 2)
            continue
          }
        }

        // 结束标记
        const endTagMatch = this.html.match(endTag)
        if (endTagMatch) {
          this.advance(endTagMatch[0].length)
          continue
        }

        // 开始标记
        const startTagMatch = this.parseStartTag()
        if (startTagMatch) {
          this.handleStartTag(startTagMatch)
          continue
        }
      }

      let text, rest, next
      if (textEnd >= 0) {
        rest = this.html.slice(textEnd)
        while (
          !endTag.test(rest) &&
          !startTagOpen.test(rest) &&
          !comment.test(rest) &&
          !conditionalComment.test(rest)
        ) {
          next = rest.indexOf('<', 1)
          if (next < 0) break
          textEnd += next
          rest = this.html.slice(textEnd)
        }
        text = this.html.substring(0, textEnd)
      }

      if (textEnd < 0) {
        text = this.html
      }

      if (text) {
        this.advance(text.length)
      }

      if (this.html === this.last) {
        break
      }
    }
  }

  /**
   * @name: 前进
   * @param {number} n 步速
   */
  advance(n: number): void {
    this.index += n
    this.html = this.html.substring(n)
  }

  /**
   * @name: 处理开始标记
   * @param {object} match 数据
   */
  handleStartTag(match: { tagName: any; attrs: string | any[]; start: any; end: any }): void {
    if (!elElement.includes(match.tagName)) {
      return
    }

    const tagName = match.tagName
    const len = match.attrs.length
    const attrs = new Array(len)

    let elButtonContent = ''

    for (let i = 0; i < len; i++) {
      const args = match.attrs[i]
      const value = args[3] || args[4] || args[5] || ''
      attrs[i] = {
        name: args[1],
        value: value
      }
      attrs[i].start = args.start + args[0].match(/^\s*/).length
      attrs[i].end = args.end
    }

    // 查找 el-button 开始标记和结束标记之间的内容
    if (match.tagName === elButton) {
      let textEnd = this.html.indexOf('</' + elButton)

      if (textEnd >= 0) {
        let text, rest, next
        if (textEnd >= 0) {
          rest = this.html.slice(textEnd)
          while (
            !endTag.test(rest) &&
            !startTagOpen.test(rest) &&
            !comment.test(rest) &&
            !conditionalComment.test(rest)
          ) {
            next = rest.indexOf('<', 1)
            if (next < 0) break
            textEnd += next
            rest = this.html.slice(textEnd)
          }
          text = this.html.substring(0, textEnd)
        }

        if (text) {
          elButtonContent = text
          this.advance(text.length)
        }
      }
    }

    if (elButtonContent) {
      if (elButtonContent.includes('</i>')) {
        let end = elButtonContent.indexOf('</i>')
        elButtonContent = elButtonContent.slice(end + 4)
      }

      elButtonContent = elButtonContent.replace(/\s/g, '').replace(/[^\u4e00-\u9fa5a-zA-Z\d]+/g, '')
    }

    const result = {
      tag: tagName,
      lowerCasedTag: tagName.toLowerCase(),
      // attrs,
      start: match.start,
      end: match.end
    }

    if (tagName === elButton) {
      result.text = elButtonContent
      result.isElButtonAuth = attrs.find((v) => v.name === elButtonAuth) ? true : false
    }

    if (tagName === elTable) {
      result.isElTableNewAuth = attrs.find((v) => v.name === elTableNewAuth) ? true : false
      result.isElTableOldAuth = attrs.find((v) => v.name === elTableOldAuth) ? true : false
    }

    if (tagName === dynamicComponent) {
      result.isDynamicComponent = true
    }

    this.startTagList.push(result)
  }

  /**
   * @name:  解析开始标记
   * @return {Object} 解析后的数据
   */
  parseStartTag(): { tagName: any; attrs: string | any[]; start: any; end: any; unarySlash: any } | void {
    const start = this.html.match(startTagOpen)
    if (start) {
      const match = {
        tagName: start[1],
        attrs: [],
        start: this.index,
        end: 0,
        unarySlash: ''
      }
      this.advance(start[0].length)

      let end = null
      let attr = null

      while (
        !(end = this.html.match(startTagClose)) &&
        (attr = this.html.match(dynamicArgAttribute) || this.html.match(attribute))
      ) {
        attr.start = this.index
        this.advance(attr[0].length)
        attr.end = this.index
        match.attrs.push(attr)
      }

      if (end) {
        match.unarySlash = end[1]
        this.advance(end[0].length)
        match.end = this.index
        return match
      }
    }
  }
}
