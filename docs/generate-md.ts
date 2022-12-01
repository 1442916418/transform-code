import { sep } from 'path'

import { getMarkdownContent } from './md-template'
import { handleWriteFile } from '../utils'

/**
 * 生成 markdown 类
 */
class GenerateMarkdown {
  /**
   * @name: 需要读取的路由
   */
  item: any
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
  docsBasePath: string

  constructor(options: options) {
    this.item = options.item
    this.isJson = options.isJson
    this.basePath = options.basePath
    this.docsBasePath = options.docsBasePath
  }

  init() {
    this.handleMarkdownContent()
  }

  handleMarkdownContent() {
    if (!this.item && !this.item.result) return

    const {
      name,
      result,
      meta: { title }
    } = this.item

    result.title = title

    const markdownContent = getMarkdownContent(result)

    handleWriteFile({
      path: `${this.docsBasePath}${sep}${name}${sep}README.md`,
      content: markdownContent
    })
  }
}

export default GenerateMarkdown

interface options {
  item: object
  isJson?: boolean
  basePath: string
  docsBasePath: string
}
