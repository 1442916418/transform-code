import { Command } from 'commander'
// BUG: 找不到模块
import { checkPath } from '@tools'

import Pretreatment from './pretreatment'

const program = new Command()

const packageJSON = require('../package.json')

program.version(packageJSON.version)
// 配置对应命令参数
program
  .option('-v, --version', 'output tool version')
  .option('-e, --entry <type>', 'custom entry')
  .option('-o, --output <type>', 'output dirtory')
program.parse(process.argv)

const options = program.opts()

const { entry, output = 'src-output' } = options

if (checkPath(entry)) {
  console.log('🚀 ~ file: index.ts:19 ~ entry, output', entry, output)
  new Pretreatment({ entry, output })
}
