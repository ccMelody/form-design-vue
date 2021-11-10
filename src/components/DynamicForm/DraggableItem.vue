
<script>
import draggable from 'vuedraggable'
import render from './components/render'

//删除按钮
const components = {
  itemBtns(h, element, index, parent, root) {
    const { copyItem, deleteItem } = this.$listeners
    const visibility ='visibility:' + (root && root.cmpType === 'custom' ? 'hidden;' : 'visible;')
    return  [
      <span class="drawing-item-delete" style={visibility} title="删除" onClick={event => {
        deleteItem(index, parent); event.stopPropagation()
      }}>
        <i class="el-icon-close" />
      </span>
    ]
  }
}
const layouts = {
  //普通的组件（除去布局容器组件和表格明细组件，通过layout属性判定）
  colFormItem(h, element, index, parent, root) {
    // console.log("当前的element",element)
    const { activeItem } = this.$listeners
    let className = this.activeId === element.formId ? 'drawing-item active-from-item' : 'drawing-item'
    if (this.formConf.unFocusedComponentBorder) className += ' unfocus-bordered';//显示未选中组件边框(目前暂没用到)
  
    return (
      <el-col span={element.span} class={className}
        nativeOnClick={event => { (activeItem(element),event.stopPropagation()) }}>
        <el-form-item label-width={element.labelWidth ? `${element.labelWidth}px` : null}
          label={element.label} required={element.required}>
          <render key={element.renderKey} conf={element} onInput={ event => {
            this.$set(element, 'defaultValue', event)
          }} />
        </el-form-item>
        { components.itemBtns.apply(this, arguments)}
      </el-col>
    )
  },
  //布局容器or表格明细组件
  rowFormItem(h, element, index, parent) {
    // console.log("element-row",element)

    const { activeItem } = this.$listeners
    const { put } = this.$attrs
    const className = this.activeId === element.formId ? 'drawing-row-item active-from-item' : 'drawing-row-item'
   
    let child = renderChildren.apply(this, arguments)
    if (element.type === 'flex') {
      child = <el-row type={element.type} justify={element.justify} align={element.align} >
                {child}
              </el-row>
    }
    const group = {name: 'componentsGroup', put:(...arg) => put(...arg, element)}
    const isCustom = element.cmpType === 'custom'
    return (
      <el-col span={element.span}>
        <el-row gutter={element.gutter} class={className} style="margin-left:0;"
          nativeOnClick={event => { (activeItem(element), event.stopPropagation()) }}>
          <span class="component-name" >{element.label}</span>
          <draggable list={element.children} animation={0} group={group} disabled={isCustom} class="drag-wrapper">
            {child}
          </draggable>
          { components.itemBtns.apply(this, arguments)}
          {
            element.rowType === 'table' && 
              <div style="text-align: center;background: white;color: #4e79ff;padding: .4rem 1rem;">
                <i class="el-icon-plus"></i> {element.actionText}
              </div>
          } 
        </el-row>
      </el-col>
    )
  }
}

function renderChildren(h, element, index, parent) {
  if (!Array.isArray(element.children)) return null
  return element.children.map((el, i) => {
    const layout = layouts[el.layout]
    if (layout) {
      return layout.call(this, h, el, i, element.children, element)
    }
    return layoutIsNotFound()
  })
}

function layoutIsNotFound() {
  throw new Error(`没有与${this.element.layout}匹配的layout`)
}

export default {
  components: {
    render,
    draggable
  },
  props: [
    'element',
    'index',
    'drawingList',
    'activeId',
    'formConf'
  ],
  render(h) {
    const layout = layouts[this.element.layout]

    if (layout) {
      return layout.call(this, h, this.element, this.index, this.drawingList)
    }
    return layoutIsNotFound()
  }
}
</script>
