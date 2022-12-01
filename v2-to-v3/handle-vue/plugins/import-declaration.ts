import * as t from '@babel/types'

/**
 * 移除 vue-property-decorator
 */
export default function () {
  return {
    visitor: {
      ImportDeclaration: function (path: any) {
        if (t.isStringLiteral(path.node.source, { value: 'vue-property-decorator' })) {
          path.remove()
        }
      }
    }
  }
}
