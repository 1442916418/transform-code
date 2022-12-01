export const getMarkdownContent = (params: MarkdownContentParams) => {
  const searchOperationContent = getSearchOperationContent(params.searchOperation)
  const searchParamsContent = getSearchParamsContent(params.searchParams)

  const dataOperationContent = getDataOperationContent(params.dataOperation)
  const dataParamsContent = getDataParamsContent(params.dataParams)

  const result = `
# ${params.title}

${params.title}基础介绍

## **查询数据**  

### 查询数据操作

${searchOperationContent}
### 查询数据条件

${searchParamsContent}
## **数据展示**  

### 数据展示操作

${dataOperationContent}
### 数据展示字段

${dataParamsContent}`

  return result
}

/**
 * @name：获取表格区域，条件内容
 * @param value 源数据
 * @returns 条件内容
 */
const getDataParamsContent = (value: object[]): string => {
  if (!value.length) return ''

  let result = ''

  value.forEach((v: any) => {
    const text = v.attrs.find((f: any) => f.name === 'label')?.value ?? ''
    result += `- ${text}  \n`
  })

  return result
}

/**
 * @name：获取表格区域，操作内容
 * @param value 源数据
 * @returns 操作内容
 */
const getDataOperationContent = (value: object[]): string => {
  if (!value.length) return ''

  let result = ''

  value.forEach((v: any) => {
    result += `<fold-details summary="${v.text}">\n\n${v.text}详情\n\n</fold-details>\n\n`
  })

  return result
}

/**
 * @name：获取搜索区域，条件内容
 * @param value 源数据
 * @returns 条件内容
 */
const getSearchParamsContent = (value: object[]): string => {
  if (!value.length) return ''

  let result = ''

  value.forEach((v: any) => {
    const text = v.attrs.find((f: any) => f.name === 'label')?.value ?? ''
    result += `- ${text}  \n`
  })

  return result
}

/**
 * @name：获取搜索区域操作内容
 * @param value 源数据
 * @returns 操作内容
 */
const getSearchOperationContent = (value: object[]): string => {
  if (!value.length) return ''

  let result = ''

  value.forEach((v: any) => {
    result += `<fold-details summary="${v.text}">\n\n${v.text}详情\n\n</fold-details>\n\n`
  })

  return result
}

interface MarkdownContentParams {
  /**
   * 标题
   */
  title: string
  /**
   * 搜索参数
   */
  searchParams: object[]
  /**
   * 搜索操作
   */
  searchOperation: object[]
  /**
   * 表格展示数据
   */
  dataParams: object[]
  /**
   * 表格操作
   */
  dataOperation: object[]
}
