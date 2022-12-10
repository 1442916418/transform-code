import { Command } from 'commander'
import { checkPath } from '@tools'

import Pretreatment from './pretreatment'

const program = new Command()

const packageJSON = require('../package.json')

program.version(packageJSON.version)
// 配置对应命令参数
program
  .option('-v, --version', 'output tool version')
  .option('-e, --entry <type>', 'custom entry')
  .option('-o, --output <type>', 'output path')
program.parse(process.argv)

const options = program.opts()

const { entry, output = 'src-output' } = options

if (!checkPath(entry)) {
  process.exit(0)
}

new Pretreatment({ entry, output })
