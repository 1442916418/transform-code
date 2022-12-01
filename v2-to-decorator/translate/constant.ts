/// <reference path="../../types/validation.ts" />

/**
 * @name：Ast type
 */
export const TYPES: Validation.VueJsToTsConstantTypes = {
  ImportDeclaration: 'handleImportDeclaration',
  VariableDeclaration: 'handleVariableDeclaration',
  ExportDefaultDeclaration: 'handleExportDefaultDeclaration'
}

/**
 * @name：Vue options
 */
export const VUE_OPTIONS: Validation.VueOptions = {
  /**
   * data
   */
  data: 'handleVueDataOptions',
  /**
   * props
   */
  props: 'handleVuePropsOptions',
  /**
   * computed
   */
  computed: 'handleVueComputedOptions',
  /**
   * watch
   */
  watch: 'handleVueWatchOptions',
  /**
   * methods
   */
  methods: 'handleVueMethodsOptions',
  /**
   * mixins
   */
  mixins: 'handleVueMixinsOptions',
  /**
   * components
   */
  components: 'handleVueComponentsOptions',
  /**
   * name
   */
  name: 'handleVueNameOptions',
  /**
   * beforeCreate
   */
  beforeCreate: 'handleVueBeforeCreateOptions',
  /**
   * created
   */
  created: 'handleVueCreatedOptions',
  /**
   * beforeMount
   */
  beforeMount: 'handleVueBeforeMountOptions',
  /**
   * mounted
   */
  mounted: 'handleVueMountedOptions',
  /**
   * beforeUpdate
   */
  beforeUpdate: 'handleVueBeforeUpdateOptions',
  /**
   * updated
   */
  updated: 'handleVueUpdatedOptions',
  /**
   * beforeDestroy
   */
  beforeDestroy: 'handleVueBeforeDestroyOptions',
  /**
   * destroyed
   */
  destroyed: 'handleVueDestroyedOptions'
}
