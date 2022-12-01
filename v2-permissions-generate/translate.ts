import request from 'request'
import md5 from 'md5'
import path from 'path'
import fs from 'fs'

import { elButton } from '../constant'
import { handleWriteFile, handleDataToString } from '../utils/index'

const camelCase = require('loadsh/camelCase')

const chineseData = new Set()

interface englishDataOptions {
  index: number
  label: string
  value: string
}

/**
 * @name: 翻译
 * @description: 中文 to 英文
 */
class Translate {
  /**
   * @name: 收集中文数据
   * @description: 收集 el-button 的文字内容
   * @param {object} list 数据（全部路径数据）
   */
  static handleCollectChineseData(list: object[]): void {
    if (list && list.length) {
      const handleData = (itemData: any) => {
        if (!itemData.isLayout) {
          if ('authInfo' in itemData && itemData.authInfo.length) {
            itemData.authInfo.forEach((v: any) => {
              if (v.lowerCasedTag === elButton && v.text && !chineseData.has(v.text)) {
                chineseData.add(v.text)
              }
            })
          }

          if (itemData.isDynamicComponent && itemData.dynamicComponentAst) {
            itemData.dynamicComponentAst.forEach((d: any) => {
              d.authInfo.forEach((v: any) => {
                if (v.lowerCasedTag === elButton && v.text && !chineseData.has(v.text)) {
                  chineseData.add(v.text)
                }
              })
            })
          }
        }

        if (itemData.children && itemData.children.length) {
          itemData.children.forEach((v: any) => {
            handleData(v)
          })
        }
      }

      list.forEach((item: any) => {
        handleData(item)
      })
    }
  }

  /**
   * @name: 中文 to 英文
   * @param {boolean} isJson 是否生成 json 文件
   */
  static handleChineseDataToEnglish(isJson: boolean = false): void {
    if (chineseData.size) {
      let str = ''

      for (let v of chineseData.values()) {
        str += v + '\n'
      }

      if (isJson) {
        handleWriteFile({
          path: Translate.getFilePath('../json/translate/zh.txt'),
          content: str
        })
      }

      Translate.getBaiBuTranslateData(str, isJson)
    }
  }

  /**
   * @name: 获取翻译数据
   * @param {string} data 中文数据（加换行符）
   * @param {boolean} isJson 是否生成 json 文件
   */
  static getBaiBuTranslateData(data: string, isJson: boolean): void {
    const query = data
    const appid = '20211227001040098'
    const key = 'FNIO9tKNiNH1uvHG3amU'
    const salt = new Date().getTime()
    const from = 'zh'
    const to = 'en'
    const str = appid + query + salt + key
    const sign = md5(str)

    request(
      {
        url: `https://fanyi-api.baidu.com/api/trans/vip/translate?q=${encodeURI(
          query
        )}&appid=${appid}&salt=${salt}&from=${from}&to=${to}&sign=${sign}`,
        method: 'get',
        json: true
      },
      function (error, response, body) {
        if (!error && response.statusCode === 200) {
          Translate.handleTranslateReuslt(body, isJson)
        }

        if (error) {
          console.log('---------------- getBaiBuTranslateData error ----------------')
          console.log(error)
        }
      }
    )
  }

  /**
   * @name: 处理翻译结果
   * @description 把翻译的结果转换成小驼峰命名法，并加上后缀
   * @param {object} value 翻译结果
   * @param {boolean} isJson 是否生成 json 文件
   */
  static handleTranslateReuslt(value: { trans_result: object[] }, isJson: boolean): void {
    if (!value) return

    let { trans_result } = value

    if (!trans_result || !trans_result.length) return

    trans_result = trans_result.map((v: any, i: number) => {
      return {
        index: i,
        label: v.src,
        value: `${camelCase(v.dst)}_btn`
      }
    })

    if (isJson) {
      handleWriteFile({
        path: Translate.getFilePath('../json/translate/en.json'),
        content: handleDataToString(trans_result)
      })
    }
  }

  static getFilePath(v: string): string {
    return path.resolve(__dirname, v)
  }

  /**
   * @name: 获取翻译并处理好的英文数据
   * @return {object[]} 英文数据
   */
  static getTranslateEnData(): object[] {
    const filePath = Translate.getFilePath('../json/translate/en.json')

    let result: object[] = []

    const data = fs.readFileSync(filePath, {
      encoding: 'utf8'
    })

    if (data) {
      result = typeof data == 'string' ? JSON.parse(data) : data
    } else {
      throw new Error('读取错误')
    }

    return result
  }
}

export default Translate
