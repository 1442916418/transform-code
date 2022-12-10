import path from 'path'
import chalk from 'chalk'
import progress from 'progress'
import fse from 'fs-extra'

import HandleVue from './handle-vue'

import * as types from '$types-v3'
import { handleWriteFile, handleDataToString, listFiles } from '@tools'

const { log, error } = console

class Pretreatment {
  /**
   * @name: 是否生成结果文件
   */
  isAllJson: boolean | undefined
  /**
   * 所有文件路径
   */
  paths: { path: string; size: number }[]
  /**
   * @name: 进度条
   */
  progressTop: any
  entry: string
  output: string

  constructor(options: types.vue3Constructor) {
    this.isAllJson = true
    this.entry = options.entry
    this.output = options.output

    this.paths = []

    this.initialization()
  }

  initialization() {
    log(chalk.green`\n  开始处理 \n`)

    this.handleFilePaths()
    this.handleTransform()
  }

  /**
   * 处理转换
   */
  handleTransform() {
    if (!this.paths.length) {
      log(chalk.yellow('  需要处理的路径为空'))
      return
    }

    this.handleProgressInit()

    const { paths, entry, output, progressTop, handleTransformsContent, handleOutputFolder } = this

    const outFullPath = path.resolve(process.cwd(), output)

    let result = true

    paths.forEach(({ path: srcPath }) => {
      try {
        let filePath = srcPath.substring(entry.length)
        let outPath = path.join(outFullPath, filePath)

        handleOutputFolder(outPath)

        const { success } = handleTransformsContent(srcPath, outPath)

        if (!success) {
          result = success
        }
      } catch (err) {
        error(err)
        result = false
      }

      progressTop && progressTop.tick()
    })

    if (result) {
      console.log(chalk.green`\n  处理成功!\n`)
    } else {
      console.log(chalk.red`\n  处理失败!\n`)
    }
  }

  /**
   * 处理转换内容
   * @param srcFilePath 原路径
   * @param outFilePath 输出路径
   */
  handleTransformsContent(srcFilePath: string, outFilePath: string) {
    let source = null

    try {
      source = fse.readFileSync(srcFilePath).toString()
    } catch (err) {
      console.log('transform error: ' + srcFilePath)
      console.error(err)
      return { success: false }
    }

    if (source === null) {
      return { success: false }
    }

    if (source.trim() === '') {
      fse.writeFileSync(outFilePath, source)
      return { success: true }
    }

    let success = true

    const ext = path.extname(srcFilePath)
    const config = {
      srcFilePath,
      outFilePath
    }

    switch (ext) {
      case '.vue':
        try {
          const newSourceCode = HandleVue.init(source, config)

          if (typeof newSourceCode === 'string') {
            fse.writeFileSync(outFilePath, newSourceCode)
          } else {
            throw new Error(`处理 ${srcFilePath}, 必须返回字符串内容 `)
          }
        } catch (err) {
          log(chalk.yellow`\n  转换错误 ${srcFilePath}!\n`)
          success = false
        }
        break
      default:
        fse.writeFileSync(outFilePath, source)
        break
    }

    return { success }
  }

  /**
   * 输出时生成新文件夹
   * @param outFile 输出路径
   */
  handleOutputFolder(outFile: string) {
    let outDir = outFile

    const lastSepIndex = outFile.lastIndexOf(path.sep)

    if (lastSepIndex > -1) {
      outDir = outFile.substring(0, lastSepIndex)
    }

    if (!fse.existsSync(outDir)) {
      fse.mkdirsSync(outDir)
    }
  }

  /**
   * 处理路径
   */
  handleFilePaths() {
    this.paths = listFiles(this.entry)

    // handleWriteFile({
    //   path: '.\\json\\paths.json',
    //   content: handleDataToString(this.paths)
    // })
  }

  /**
   * 初始化进度条
   */
  handleProgressInit() {
    this.progressTop = new progress('  处理中: [:bar] :current/:total    ', { total: this.paths.length })
  }
}

export default Pretreatment
