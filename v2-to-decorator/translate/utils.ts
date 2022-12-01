/**
 * @name: 截断字符串
 * @param value 源数据
 * @param startIndex 开始下标
 * @param endIndex   结束下标
 * @returns 数据
 */
export const getSubstringData = (value: string, startIndex: number, endIndex: number): string => {
  if (!value) return ''

  return value.substring(startIndex, endIndex)
}

/**
 * @name: 设置第一个字母为大写
 * @param value 源数据
 * @returns 数据
 */
export const setCapitalizeWord = (value: string): string => {
  if (!value) return ''

  return `${value.charAt(0).toLocaleUpperCase()}${value.substring(1)}`
}
