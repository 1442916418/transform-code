import fs from 'fs'
import path from 'path'
import fse from 'fs-extra'

import { isFileExist } from './common'

/**
 * @name: 写入文件
 * @param {string} path 路径
 * @param {string} content 数据
 */
export const handleWriteFile = (v: { path: string; content: string }): void => {
  if (!v.path) {
    throw new Error('\n utils handleWriteFile: 写入文件请传入路径')
  }

  let fileDir: any = v.path.split(path.sep).slice(0, -1)

  fileDir = path.join(...fileDir)

  if (fileDir && !isFileExist(fileDir)) {
    fs.mkdirSync(fileDir)
  }

  fs.writeFile(
    v.path,
    v.content,
    {
      encoding: 'utf8'
    },
    (err: any) => {
      if (err) {
        console.error(err)
        return
      }
      // console.log(`${path} => 文件写入成功`)
    }
  )
}

/**
 * @name: 移除文件夹
 * @param {object} option
 * @param {string} dir 需要删除的文件夹
 */
export const removeDir = (option: { dir: string }): void => {
  const { dir } = option
  if (!isFileExist(dir)) return

  // 读取目录中文件夹
  const files = fs.readdirSync(dir)
  files.forEach((file: string) => {
    const filePath = path.resolve(dir, file)
    const stat = fs.lstatSync(filePath)
    // 如果是directory, 就递归
    if (stat.isDirectory()) {
      removeDir({
        dir: filePath
      })
      return
    }
    // 如果是文件 就删除
    if (stat.isFile()) {
      fs.unlinkSync(filePath)
    }
  })

  // 删除空目录
  fs.rmdirSync(dir)
}

/**
 * @name: 打开并读取文件内容
 * @param filePath 文件路径
 * @param callback 回调函数
 */
export const handleOpenAndReadFile = (filePath: string, callback: Function): void => {
  if (!filePath) return

  fs.open(filePath, 'r', (err, fd) => {
    if (err) {
      throw err
    }

    const result = fs.readFileSync(filePath, {
      encoding: 'utf8'
    })

    callback(result)
  })
}

/**
 * 列出项目所有文件
 * @param {string} rootPath
 * @param {string[]} excludePath  需要排除的目录
 * @returns
 */
export const listFiles = (rootPath: string, excludePath?: string[]) => {
  let fileList: { path: string; size: number }[] = []
  getFiles(rootPath, fileList, excludePath)
  return fileList
}

/**
 * 递归列出所有文件
 * @param parentPath 上一级目录
 * @param fileList 导出的文件列表
 * @param excludePath 需要排除的目录
 */
export const getFiles = (parentPath: string, fileList: Object[], excludePath?: string[]) => {
  let files = fse.readdirSync(parentPath)

  if (
    excludePath &&
    excludePath.find((exPath) => {
      return parentPath.indexOf(exPath) > -1
    })
  ) {
    return
  }

  files.forEach((item: string) => {
    item = path.join(parentPath, item)
    let stat = fse.statSync(item)
    try {
      if (stat.isDirectory()) {
        getFiles(item, fileList, excludePath)
      } else if (stat.isFile()) {
        fileList.push({ path: item, size: stat.size })
      }
    } catch (error) {
      console.error(error)
    }
  })
}
