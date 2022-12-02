import fs from 'fs'

/**
 * 处理数据
 * @param {Array} excludeKey 排除的 key
 * @return {*} data 数据
 */
export const getCircularReplacer = (excludeKey?: string[]): any => {
  const seen = new WeakSet()

  return (key: any, value: any) => {
    if (excludeKey) {
      if (excludeKey.includes(key)) return
    }

    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return
      }
      seen.add(value)
    }
    return value
  }
}
/**
 * 数据转成字符串
 * @return {string} data 数据
 */
export const handleDataToString = (data: any, excludeKey?: string[]): string => {
  return JSON.stringify(data, getCircularReplacer(excludeKey), 2)
}

/**
 * @name: 同步判断文件是否存在
 * @param {fs} dir 路径
 * @return {boolean}
 */
export const isFileExist = (dir: fs.PathLike): boolean => {
  if (!dir) return false

  return fs.existsSync(dir)
}
