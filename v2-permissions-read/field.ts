/// <reference path="../types/validation.ts" />

import { elButton, elTableColumn, elButtonAuth, elementBtnType, elementTableType } from '../constant'

/**
 * @name: 提取授权字段
 * @description: 根据 ast 提取字段
 * @return {Array} data 报表字段元素 + 操作元素
 */
class Field {
  /**
   * @name: 文件 ast
   */
  ast: object
  /**
   * @name: 操作元素
   */
  btnAuthData: object[]
  /**
   * @name: 报表字段元素
   */
  tableAuthData: object[]

  constructor(ast: Validation.parseComponentOptions['ast']) {
    this.ast = ast
    this.btnAuthData = []
    this.tableAuthData = []
  }

  init(): void {
    this.handleAstData()
  }

  getResult(): object[] {
    return [...this.btnAuthData, ...this.tableAuthData]
  }

  /**
   * @name: 处理 ast 数据
   */
  handleAstData(): void {
    if (!this.ast) return

    const astData: any = this.ast

    const handle = (list: string | any[]) => {
      for (let i = 0; i < list.length; i++) {
        let item = list[i]

        this.handleBtnAuth(item)
        // this.handleTableBtnAuth(item)
        // this.handleTableColumn(item)

        if (item.children && item.children.length) {
          handle(item.children)
        }
      }
    }

    if (astData.children && astData.children.length) {
      handle(astData.children)
    }
  }

  /**
   * @name: 处理操作元素
   * @description: 根据 el-button 上的指令提取数据
   * @param {Object} value 需要处理的数据
   */
  handleBtnAuth(value: { tag: string; attrsList: any[]; children: any[] }) {
    if (value.tag === elButton && value.attrsList && value.attrsList.length) {
      let findKey = value.attrsList.find((b) => b.name === elButtonAuth)

      if (findKey) {
        let findName = value.children.find((v) => v.type === 3)

        this.btnAuthData.push({
          elementType: elementBtnType,
          elementName: findName ? findName.text.replace(/\s|\n|\r/g, '') : '',
          elementValue: findKey ? findKey.value.replace(/\'/g, '') : ''
        })
      }
    }
  }

  /**
   * @name: 处理表格中的操作元素
   * @description: 根据 el-table-column slot 提取数据
   * @param {Object} value 需要处理的数据
   */
  handleTableBtnAuth(value: { tag: string; scopedSlots: { [x: string]: { [x: string]: any } } }) {
    if (value.tag === elTableColumn && value.scopedSlots) {
      let slotsChildren = value.scopedSlots['"default"']['children']

      slotsChildren &&
        slotsChildren.forEach((v: { tag: string; children: any[]; attrsList: any[] }) => {
          if (v.tag === 'template' && v.children) {
            v.children.forEach((c: { tag: string; attrsList: any[]; children: any[] }) => this.handleBtnAuth(c))
          } else {
            this.handleBtnAuth(v)
          }
        })
    }
  }

  /**
   * @name: 处理表格中的报表字段元素
   * @description: 根据 el-table-column prop 属性提取数据
   * @param {Object} value 需要处理的数据
   */
  handleTableColumn(value: { tag: string; attrsMap: { prop: string; label: any } }) {
    if (
      value.tag === elTableColumn &&
      value.attrsMap &&
      !('type' in value.attrsMap) &&
      value.attrsMap.prop &&
      value.attrsMap.prop !== 'opt'
    ) {
      this.tableAuthData.push({
        elementType: elementTableType,
        elementName: value.attrsMap.label,
        elementValue: value.attrsMap.prop
      })
    }
  }
}

export default Field
