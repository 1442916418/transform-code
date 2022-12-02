import * as t from '@babel/types'

/**
 * 移除 @Component()
 */
export default function () {
  return {
    visitor: {
      Decorator: function (path: any) {
        if (
          t.isIdentifier(path.node.expression.callee, { name: 'Component' }) ||
          t.isIdentifier(path.node.expression, { name: 'Component' })
        ) {
          path.remove()
        }
      }
    }
  }
}
