import { configOptionsType } from './common'

/**
 * 处理 vue 基础配置类型
 */
export interface handleVueConfig {
  /** 原文件路径 */
  srcFilePath: string
  /** 输出路径 */
  outFilePath: string
}

/**
 *  vue2 class 转换为 vue3 组合式写法类 - 构造器参数
 */
export type vue3Constructor = configOptionsType
