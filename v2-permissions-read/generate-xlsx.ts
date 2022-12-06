// @ts-nocheck

import request from 'request'
import xlsx from 'node-xlsx'
import path from 'path'

import { xlsxTableHeader } from '../constant'
import { handleWriteFile, handleDataToString } from '../utils/index'

const { isEmpty, cloneDeep } = require('loadsh')

const getFilePath = (v) => path.resolve(__dirname, v)

/**
 * @name: 生成 xlsx
 */
class GenerateXlsx {
  /**
   * @name: 菜单路径
   */
  data: object[]
  /**
   * @name: 请求接口路径
   */
  baseUrl: string
  /**
   * @name: 请求接口用户token
   */
  token: string
  /**
   * @name: 系统菜单（接口获取）
   */
  menuDataList: object[]
  /**
   * @name: 第一级路由菜单路径
   */
  firstLevelRouterName: string
  /**
   * @name: 第二级路由菜单路径
   */
  secondLevelRouterName: string
  /**
   * @name: 第三级路由菜单路径
   */
  thirdLevelRouterName: string
  /**
   * @name: 是否生成 json 文件
   */
  isJson?: boolean

  constructor(data: object[], baseUrl: string, token: string, isJson?: boolean) {
    this.data = data
    this.baseUrl = baseUrl
    this.token = token
    this.isJson = isJson

    this.menuDataList = []
    this.firstLevelRouterName = ''
    this.secondLevelRouterName = ''
    this.thirdLevelRouterName = ''
    this.xlsxResult = []
  }

  init() {
    this.handleData()
  }

  /**
   * @name: 处理数据
   * @description: 接口路由数据和生成的数据匹配，并生成 json 和 xlsx
   */
  handleData() {
    if (isEmpty(this.data) || isEmpty(this.menuDataList)) return

    const menuDataList = this.menuDataList

    menuDataList.forEach((menu: any) => {
      const res = this.handleMatchFieldData(menu)

      menu.menuType && this.xlsxResult.push(res)
    })

    if (this.isJson) {
      handleWriteFile({
        path: getFilePath('../xlsx/field.json'),
        content: handleDataToString(this.xlsxResult)
      })
    }

    const options = {
      sheetOptions: {
        '!cols': [{ wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 20 }]
      }
    }
    const buffer = xlsx.build(this.xlsxResult, options)

    handleWriteFile({
      path: getFilePath('../xlsx/field.xlsx'),
      content: Buffer.from(buffer)
    })
  }

  /**
   * @name: 匹配权限字段
   * @param {any} menu 菜单
   * @return {object}
   */
  handleMatchFieldData(menu: any): object {
    const { urlPath, menuType, menuName, children, parentId, id } = menu

    let result = { name: `${menuName}-${parentId}-${id}`, data: [] }

    // menuType 0：文件夹，1：菜单
    if (menuType && urlPath) {
      let fieldData = this.handleRouteFieldData(urlPath, menuName)

      if (!isEmpty(fieldData)) {
        result.data = this.handleFieldData(fieldData.field, id)

        return result
      }
    }

    if (children && children.length) {
      for (let i = 0; i < children.length; i++) {
        const res = this.handleMatchFieldData(children[i])

        if (!isEmpty(res) && children[i].menuType) {
          this.xlsxResult.push(res)
        }
      }
    }

    return result
  }

  /**
   * @name: 字段处理
   * @description: 处理成导出所需要的格式，二维数组
   * @param {object} fieldList
   * @param {number} id 菜单 id
   * @return {array} 二维数组
   */
  handleFieldData(fieldList: object[], id: number): string[] {
    if (isEmpty(fieldList)) return []

    const result = fieldList.map((v) => [id, v.elementType, v.elementName, v.elementValue])

    result.unshift(cloneDeep(xlsxTableHeader))

    return result
  }

  /**
   * @name: 查找权限字段
   * @description: 根据菜单路径匹配权限，在一级路由里查找
   * @param {string} urlPath 菜单路径
   * @param {string} menuName 菜单名称
   * @return {object}
   */
  handleRouteFieldData(urlPath: string, menuName: string): object {
    // BUG: 不支持三级路径
    // 匹配接口数据，而不是本地项目声明的
    // 匹配到以下菜单，则使用自定义的一级菜单路径
    const virtualMenu = ['员工管理']

    const findRouteData = this.data.find((v) => {
      let urls = urlPath.split('/')
      let first = urls[1]

      if (v.path === '/' + first) {
        this.firstLevelRouterName =
          virtualMenu.includes(menuName) || urlPath.includes('customerManage') ? `${urls[1]}/${urls[2]}` : first
        return v
      }
    })

    let result: object = Object.create(null)

    if (!isEmpty(findRouteData)) {
      let routeResult = this.handleMatchRoute(findRouteData, urlPath)

      if (!isEmpty(routeResult)) {
        result = routeResult
      }
    }

    return result
  }

  /**
   * @name: 匹配路由文件并获取权限字段
   * @description 在一、二、三级路由里查找
   * @param {object} data 路由
   * @param {string} urlPath 菜单路径
   * @return {object}
   */
  handleMatchRoute(data: object, urlPath: string): object {
    let result = Object.create(null)

    // @ts-ignore
    const { path, isLayout, children } = data

    let newPath = path

    if (this.firstLevelRouterName && '/' + this.firstLevelRouterName !== path) {
      newPath = `/${this.firstLevelRouterName}/${path}`
      this.secondLevelRouterName = path
    } else if (
      this.firstLevelRouterName &&
      this.secondLevelRouterName &&
      `/${this.firstLevelRouterName}/${path}` !== path
    ) {
      newPath = `/${this.firstLevelRouterName}/${this.secondLevelRouterName}/${path}`
      this.thirdLevelRouterName = path
    }

    if (!isLayout && newPath === urlPath) {
      result = data
      return result
    }

    if (children && children.length) {
      for (let i = 0; i < children.length; i++) {
        let routeResult = this.handleMatchRoute(children[i], urlPath)

        if (!isEmpty(routeResult)) {
          result = routeResult
          break
        }
      }
    }

    return result
  }

  /**
   * @name: 获取系统菜单数据
   */
  async getSystemMenuData() {
    const res = await this.requestGet().catch((error) => {
      console.log(`generate-xlsx.ts r:211 request error: \n${JSON.stringify(error)}`)
    })

    if (res) {
      const { code, data } = res

      this.menuDataList = code === 200 && data ? data : []
    }
  }

  requestGet() {
    const that = this

    if (!that.baseUrl || !that.token) return

    const url = that.baseUrl + ''

    return new Promise((resolve, reject) => {
      request(
        {
          url,
          method: 'GET',
          json: true,
          headers: {
            Authorization: that.token,
            'User-token': that.token
          }
        },
        (err, response, body) => {
          if (response.statusCode === 200) {
            resolve(body)
          } else {
            reject(body)
          }

          if (err) {
            reject(err)
          }
        }
      )
    })
  }
}

export default GenerateXlsx
