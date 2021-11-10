
<template>
  <div class="container">
    <!-- 左侧的组件选择 -->
    <div class="left-board">
      <el-scrollbar class="left-scrollbar">
        <el-tabs v-model="activeTabName" :stretch="true">
          <el-tab-pane label="常用组件" name="common">
            <div class="components-list">
              <draggable
                class="components-draggable"
                :list="commonComponents"
                :group="{ name: 'componentsGroup', pull: 'clone', put: false }"
                :clone="cloneComponent"
                draggable=".components-item"
                :sort="false"
                @end="onEnd"
              >
                <div
                  v-for="(element, index) in commonComponents"
                  :key="index"
                  class="components-item" @click="addComponent(element)">
                  <div class="components-body">
                    <svg-icon :icon-class="element.tagIcon" />
                    {{ element.label }}
                  </div>
                </div>
              </draggable>
            </div>
          </el-tab-pane>
          <el-tab-pane label="定制组件" name="custom">
            <div class="components-list">
              <!-- <div class="components-title">
                <svg-icon icon-class="component" />布局型组件
              </div>-->
              <draggable
                class="components-draggable"
                :list="customMadeComponents"
                :group="{ name: 'componentsGroup', pull: 'clone', put: false }"
                :clone="cloneComponent"
                draggable=".components-item"
                :sort="false"
                @end="onEnd"
              >
                <div
                  v-for="(element, index) in customMadeComponents"
                  :key="index"
                  class="components-item custom-component"
                  @click="addComponent(element)"
                >
                  <div class="components-body">
                    <svg-icon :icon-class="element.tagIcon" />
                    {{ element.label }}
                  </div>
                </div>
              </draggable>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-scrollbar>
    </div>
    <!-- 展示选择的自定义组件 -->
    <div class="center-board">
      <div class="action-bar">
        <!-- <el-button icon="el-icon-video-play" type="text" @click="run">
          运行
        </el-button>
        <el-button icon="el-icon-download" type="text" @click="download">
          导出vue文件
        </el-button>
        <el-button class="copy-btn-main" icon="el-icon-document-copy" type="text" @click="copy">
          复制代码
        </el-button> -->
        <el-button
          class="copy-btn-main"
          icon="el-icon-success"
          type="text"
          @click="preview"
        >预览</el-button>
        <el-button class="delete-btn" icon="el-icon-delete" type="text" @click="empty">清空</el-button>
      </div>
      <div id="ipad" ref="ipad">
        <div class="outeripad" :class="[ipadMode]">
          <div class="ipadbody">
            <div class="ipadscreen">
              <el-scrollbar class="center-scrollbar">
                <el-row class="center-board-row" :gutter="formConf.gutter">
                  <el-form
                    :size="formConf.size"
                    :label-position="formConf.labelPosition"
                    :disabled="formConf.disabled"
                    :label-width="formConf.labelWidth + 'px'"
                  >
                    <draggable
                      class="drawing-board"
                      :list="drawingList"
                      :animation="200"
                      group="componentsGroup"
                      @end="onMianDragEnd"
                    >
                      <draggable-item
                        v-for="(element, index) in drawingList"
                        :key="element.renderKey"
                        :drawing-list="drawingList"
                        :element="element"
                        :index="index"
                        :active-id="activeId"
                        :form-conf="formConf"
                        :put="shouldClone"
                        @activeItem="activeFormItem"
                        @copyItem="drawingItemCopy"
                        @deleteItem="drawingItemDelete"
                      />
                    </draggable>
                    <div v-show="!drawingList.length" class="empty-info">从左侧拖入或点选组件进行表单设计</div>
                  </el-form>
                </el-row>
              </el-scrollbar>
            </div>
            <div class="ipadcamera"></div>
            <el-tooltip effect="dark" content="切换横/竖模式" placement="top">
              <div class="ipadhomebutton" @click="ipadMode = ipadMode === 'landscape' ? 'portrait' : 'landscape'">
              </div>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>
    <!-- 右侧 对组件的参数配置 -->
    <right-panel
      :active-data="activeData"
      :form-conf="formConf"
      :show-field="!!drawingList.length"
      :couldChangeRequire="!isProCondition(activeData)"
      @tag-change="tagChange"
    />

    <!-- <form-drawer
      :visible.sync="drawerVisible"
      :form-data="formData"
      size="100%"
      :generate-conf="generateConf"
    />-->
    <!-- <code-type-dialog
      :visible.sync="dialogVisible"
      title="选择生成类型"
      :show-file-name="showFileName"
      @confirm="generate"
    />-->
    <input id="copyNode" type="hidden" />
  </div>
</template>

<script>
//拖拽的插件
import draggable from "vuedraggable";
// import { saveAs } from 'file-saver'
// import beautifier from 'beautifier'
// import ClipboardJS from 'clipboard'
import render from "./components/render";
// import FormDrawer from './FormDrawer'
import RightPanel from "./RightPanel";//右侧表单设置
import {
  inputComponents,selectComponents,
  layoutComponents,customMadeComponents,
  commonComponents,formConf} from "./components/generator/config";
import {exportDefault,beautifierConf,isNumberStr,titleCase} from "./utils/index";
import {makeUpHtml,vueTemplate,vueScript,cssStyle} from "./components/generator/html";
import { makeUpJs } from "./components/generator/js";
import { makeUpCss } from "./components/generator/css";
import drawingDefalut from "./components/generator/drawingDefalut";//表单设计的默认数据
// import CodeTypeDialog from './CodeTypeDialog'
import DraggableItem from "./DraggableItem";//表格组件里面的拖拽项
import {getDrawingList,saveDrawingList,getFormConf
  // getIdGlobal,saveIdGlobal,
} from "./utils/db";
import { debounce } from '@/utils'

const emptyActiveData = { style: {}, autosize: {} };
let oldActiveId;
let tempActiveData;
const formConfInDB = getFormConf();
// const idGlobal = getIdGlobal();
export default {
  components: {
    draggable,//拖拽插件
    render,
    RightPanel,//右侧的组件属性和表单属性配置区域
    DraggableItem,//表格组件里面的拖拽项
    // FormDrawer,
    // CodeTypeDialog,
  },
  props:['tabName', 'conf'],
  //tabName:当前tab（表单设计：formDesign）
  //conf:表单设计的配置项数据
  data() {
    const storageList = getDrawingList();//获取当前表单设计的组件数据（fields字段）
    console.log("stoage-drawing",storageList)
    //获取表单设计的组件数据(formData.fields)
    const drawingList = Array.isArray(storageList) && storageList.length ? storageList : drawingDefalut
    return {
      // idGlobal,
      formConf,//默认表单属性的配置，进入页面后若conf有值被赋值为整个自定义表单的所有配置数据
      inputComponents,//各类型输入框的配置项（数组对象）
      selectComponents,//各类型选择框的数据配置项
      layoutComponents,//放置组件的容器配置项
      commonComponents,//上面三个配置项的组合
      customMadeComponents,//定制组件
      labelWidth: 100,//表单域标签的宽度
      drawingList,//表单设计的组件数据
      drawingData: {},
      activeId: drawingList ? drawingList[0].formId : "",//当前选中的自定义组件的id
      drawerVisible: false,
      formData: {},//存放自定义表单数据
      dialogVisible: false,
      generateConf: null,
      showFileName: false,
      activeData: drawingList[0],//当前选中的自定义组件，默认为第一个
      activeTabName: "common",//常用组件/定制组件的切换标志位
      ipadMode: 'portrait',//ipad展示形式，横屏landscape/竖屏portrait
      testObj:{}
    };
  },
  watch: {
    // eslint-disable-next-line func-names
    //当前点击或者拖动的组件的formId
    activeId: {
      handler(val) {
        oldActiveId = val;
      },
      immediate: true
    },
    drawingList: {//表单设计的组件的数据
      handler(val) {
        if (!val) return
        if (!this.afterDrawingChange) {
          this.afterDrawingChange = debounce(this.handlerListChange, 400) // 使用了deep 所以刷新会比较频繁
        }
        this.afterDrawingChange()
      },
      deep: true,
      immediate: true
    },
    // idGlobal: {
    //   handler(val) {
    //     saveIdGlobal(val);
    //   },
    //   immediate: true
    // }
  },
  created() {
    console.log("conf----",this.conf)
    if (typeof this.conf === 'object' && this.conf !== null) {
      this.drawingList = this.conf.fields
      Object.assign(this.formConf, this.conf)
    }else{
      const drawingListInDB = getDrawingList()
      const hasStorage = Array.isArray(drawingListInDB) && drawingListInDB.length > 0
      this.drawingList = hasStorage ? drawingListInDB : drawingDefalut;//取storage或者默认数据的fields字段
      formConfInDB && (this.formConf = formConfInDB);//右侧的表单属性
    }
    this.activeFormItem(this.drawingList[0])
    this.$nextTick(_ => this.getIpadMode())

    // const clipboard = new ClipboardJS('#copyNode', {
    //   text: trigger => {
    //     const codeStr = this.generateCode()
    //     this.$notify({
    //       title: '成功',
    //       message: '代码已复制到剪切板，可粘贴。',
    //       type: 'success'
    //     })
    //     return codeStr
    //   }
    // })
    // clipboard.on('error', e => {
    //   this.$message.error('代码复制失败')
    // })
  },
  methods: {
    //iPad的切换横竖屏模式
    getIpadMode () {
      const {clientHeight, clientWidth} = this.$refs.ipad
      this.ipadMode = clientWidth * 0.74 > clientHeight ? 'landscape' : 'portrait';
    },
    //选中的自定义组件的数组的变化
    handlerListChange(val){
      const vm = this
      this.$store.commit('clearPCondition') // 清除所有条件 重新检测赋值
      const canUsedAsPCon = (conf, parent) => {
          const isRangeCmp = ['fc-date-duration','fc-time-duration'].includes(conf.tag)
          if(isRangeCmp && !conf.showDuration) return false
          if(parent && parent.rowType === 'table') return false 
          if(!conf.proCondition || !conf.required) return false
          if(conf.tag === 'el-select' && conf.multiple) return false
          return true 
        }
        const loop = (data, parent) => {
          if(!data) return
          Array.isArray(data.children) && data.children.forEach(child => loop(child, data))
          if(Array.isArray(data)){
            data.forEach(loop)
          }else{
            //删除or增加用于流程图的条件信息
            canUsedAsPCon(data, parent) 
            ? vm.$store.commit("addPCondition", data) 
            : vm.$store.commit("delPCondition", data.formId)
          }
        }
        loop(this.drawingList)
        saveDrawingList(this.drawingList);//存储自定义组件的每一项
        this.$store.commit('updateFormItemList', this.drawingList)
        // if (val.length === 0) this.idGlobal = 100;
    },
    /**
     * 判断是否是常用组件
     * 非常用组件即套餐组件  不能新填或删除子组件
     */
    isCommonCmp(name){
      return this.commonComponents.findIndex(t => t.label === name) > -1
    },
    /**
     * 阻止表格中嵌套行容器
     * 定制组件不能添加子组件
     */
    shouldClone(to, from ,target, event, conf){
       // .drawing-row-item —— 行容器的类名 ipad里面的组件才会带有
      // 直接拖拽的行容器 最外层含有.drawing-row-item
      // 定制组件 内部含有.drawing-row-item
      // const hasRow = target.classList.contains('.drawing-row-item') || target.querySelector('.drawing-row-item') !== null
      // const isRowContainer = ['布局容器', '表格/明细'].includes(target.innerText) //是阻止从左侧拖拽嵌套
      // const isCusFromLeft = target.classList.contains('custom-component')
      const targetConf = target._underlying_vm_
      const isRowContainer = conf.cmpType === 'common' && conf.rowType === 'layout'
      if (isRowContainer) return true
      if (conf.cmpType === 'custom') return false
      if (conf.rowType === 'table') {
        if (targetConf.layout === 'rowFormItem') return false
        if (this.isFilledPCon([targetConf.formId])) return false
      }
      return  true
    },
    //获取当前元素的参数
    activeFormItem(element) {
      if(element){
        this.activeData = element;
        this.activeId = element.formId;
      }
    },
    //拖动结束发生的事件
    onEnd(obj, a) {
      if (obj.from !== obj.to) {
        this.activeId = tempActiveData.formId;
        this.activeData = tempActiveData;
      }
    },
    //在ipad区域拖动结束时触发(更改已展示组件的的index)
    onMianDragEnd(obj, a) {
      this.activeFormItem(this.drawingList[obj.newIndex]);
    },
    //计算出相同组件的使用次数
    getSameTagCmpNum(tag){
      return this.drawingList.reduce((count, item) => {
        if(item.children){
          return count + item.children.reduce((c, t)=>{
            return t.tag === tag ? c + 1 : c
          }, 0)
        }
        return item.tag === tag ? count + 1 : count
      }, 0)
    },
    //设置每个组件的label字段值（若同一组件用了多次则给label重新赋值）
    createCmpLabel(cmp){
      const len = this.getSameTagCmpNum(cmp.tag)
      return len ? cmp.label + len : cmp.label
    },
    //点击左侧组件添加到ipad
    addComponent(item) {
      const clone = this.cloneComponent(item);
      this.drawingList.push(clone);
      this.activeFormItem(clone);
    },
    getMaxId () {
      console.log(".drawingList",this.drawingList)
      if(this.drawingList.length){
        let maxId = 0
        const loop = (data, parent) => {
          if(!data) return
          Array.isArray(data.children) && data.children.forEach(child => loop(child, data))
          if(Array.isArray(data)) {
            data.forEach(loop)
          }else{
            maxId = Math.max(data.formId, maxId)
          }
        }
        loop(this.drawingList)
        return maxId
      }
      return 0
    },
    //设置formID
    getNextId(){
      // console.log("MaxId",this.getMaxId())
      let maxId = this.getMaxId() + 1
      return maxId
    },
    //clone一个item，设置当前拖动的item的属性
    cloneComponent(origin) {
      const clone = JSON.parse(JSON.stringify(origin));
      console.log("clone--",clone);
      clone.formId = this.getNextId();
      // clone.span = formConf.span;
      clone.renderKey = clone.formId + new Date().getTime(); // 改变renderKey后可以实现强制更新组件
      if (!clone.layout) clone.layout = "colFormItem";
      if (clone.layout === "colFormItem") {
        clone.label = this.createCmpLabel(clone)
        clone.vModel = `field${clone.formId}`;
        clone.placeholder !== undefined && (clone.placeholder += clone.label);
        tempActiveData = clone;
      } else if (clone.layout === "rowFormItem") {
        if (clone.rowType === 'table') {
          clone.vModel = `field${clone.formId}`;
        }
        // delete clone.label;
        clone.componentName = `row${clone.formId}`;
        clone.gutter = this.formConf.gutter;
        this.cloneChildrenOfRowFormItem(clone);
        tempActiveData = clone;
      }

      return tempActiveData;
    },
    //给容器组件设置参数
    cloneChildrenOfRowFormItem(rowFormItem) {
      if (rowFormItem.children && rowFormItem.children.length) {
        let children = rowFormItem.children;
        children.forEach((clone, index) => {
          clone.formId = rowFormItem.formId + index + 1;
          // clone.span = formConf.span;
          clone.renderKey = clone.formId + new Date().getTime(); // 改变renderKey后可以实现强制更新组件
          if (!clone.layout) clone.layout = "colFormItem";
          if (clone.layout === "colFormItem") {
            clone.vModel = `field${clone.formId}`;
            clone.placeholder !== undefined &&
              (clone.placeholder += clone.label);
          } else if (clone.layout === "rowFormItem") {
            delete clone.label;
            clone.componentName = `row${clone.formId}`;
            clone.gutter = this.formConf.gutter;
            this.cloneChildrenOfRowFormItem(clone);
          }
        });
      }
    },
    isEmptyRowContainer(){
      const rowContainer = this.drawingList.find(t => t.layout === 'rowFormItem')
      if(rowContainer){
        return rowContainer.children.length === 0
      }
    },
    //获取表单设页面的数据
    AssembleFormData() {
        this.formData = {
          ...this.formConf,
          fields: JSON.parse(JSON.stringify(this.drawingList))
        };
    },
    // 供父组件使用 获取表单JSON（在点击发布的时候在approver.vue页面中调用）
    getData() {
      return new Promise((resolve, reject) => {
        if(this.drawingList.length === 0){
          reject({ msg: '表单不允许为空', target: this.tabName})
          return
        }

        if(this.isEmptyRowContainer()){
          reject({ msg: '您的行容器中没有组件', target: this.tabName})
          return
        }
        this.AssembleFormData();
        resolve({ formData: this.formData, target: this.tabName})
      })
    },
    //跳转到生成的表单页面（预览页面）
    preview(){
       this.AssembleFormData();
      // 这是沿用form-generator 创建文本模板的方法
      
      //  let htmlCode = makeUpHtml(this.formData, "file");
      //  let jsCode = makeUpJs(this.formData, "file");
      //  let cssCode = makeUpCss(this.formData);
      //  this.$router.push({
      //    name: "preview",
      //    params: {
      //      formData: {
      //        htmlCode,
      //        jsCode,
      //        cssCode
      //      }
      //    }
      //  });
    
     // 这是使用jsx渲染
     this.$router.push({ name: "jsxPreview", params: { formData: this.formData } });
    },
    //没用到
    generate(data) {
      const func = this[`exec${titleCase(this.operationType)}`];
      this.generateConf = data;
      func && func(data);
    },
    // execRun(data) {
    //   this.AssembleFormData()
    //   this.drawerVisible = true
    // },
    // execDownload(data) {
    //   const codeStr = this.generateCode()
    //   const blob = new Blob([codeStr], { type: 'text/plain;charset=utf-8' })
    //   saveAs(blob, data.fileName)
    // },
    //---并没有被使用--
    execCopy(data) {
      document.getElementById("copyNode").click();
    },
    //删除组件or清空所有ipad区域组件
    empty() {
      if(this.isFilledPCon()) {
        this.$message.warning("尚有组件已作为流程判断条件，无法删除");
        return;
      }
      this.$confirm("确定要清空所有组件吗？", "提示", { type: "warning" }).then(
        () => {
          this.drawingList = [];
          // this.idGlobal = 100;
          this.$store.commit('clearPCondition')
        }
      );
    },
    //ipad区域的fun，但并没被调用
    drawingItemCopy(item, parent) {
      let clone = JSON.parse(JSON.stringify(item));
      clone = this.createIdAndKey(clone);
      parent.push(clone);
      this.activeFormItem(clone);
    },
    createIdAndKey(item) {
      item.formId = this.getNextId();
      item.renderKey = clone.formId + new Date().getTime();
      if (item.layout === "colFormItem") {
        item.vModel = `field${item.formId}`;
      } else if (item.layout === "rowFormItem") {
        item.componentName = `row${item.formId}`;
      }
      if (Array.isArray(item.children)) {
        item.children = item.children.map(childItem =>
          this.createIdAndKey(childItem)
        );
      }
      return item;
    },
    isFilledPCon(formIds){
      const processCmp = this.$parent.$children.find(t => t.isProcessCmp)
      return processCmp && processCmp.isFilledPCon(formIds)
    },
    checkColItem (cmp) {
      if(!cmp) return false
      const isPcon = this.$store.state.processConditions.find(t => t.formId == cmp.formId) ? true : false
      return isPcon && this.isFilledPCon([cmp.formId])
    },
    // 判断是否已被流程图作为条件必填项了
    isProCondition(cmp){
      if (Array.isArray(cmp.children) && cmp.children.length) { // 容器组件需要检查子元素
        if (cmp.rowType === 'table') return false // 表格的子元素不可能为流程条件
        let flag = false
        const loop = (el) => {
          if (flag) return // flag === true 代表找到了一个了 不需要再找下一个
          if(Array.isArray(el)){
            el.some(e => {
              if(e.children) loop(e.children)
              return this.checkColItem(e)
            }) && (flag = true)
          }
        }
        loop(cmp.children)
        return flag
      }else{
        return this.checkColItem(cmp)
      }
    },
    drawingItemDelete(index, parent) {
      // 首先判断是否是流程条件 再判断是否有节点使用过
      if (this.isProCondition(parent[index])) {
        this.$message.warning("该组件已作为流程判断条件，无法删除");
        return 
      }
      this.$store.commit("delPCondition", parent[index].formId);
      parent.splice(index, 1);
      this.$nextTick(() => {
        const len = this.drawingList.length;
        if (len) {
          this.activeFormItem(this.drawingList[len - 1]);
        }
      });
    },
    // generateCode() {
    //   const { type } = this.generateConf
    //   this.AssembleFormData()
    //   const script = vueScript(makeUpJs(this.formData, type))
    //   const html = vueTemplate(makeUpHtml(this.formData, type))
    //   const css = cssStyle(makeUpCss(this.formData))
    //   return beautifier.html(html + script + css, beautifierConf.html)
    // },
    // download() {
    //   this.dialogVisible = true
    //   this.showFileName = true
    //   this.operationType = 'download'
    // },
    //没使用
    run() {
      this.dialogVisible = true;
      this.showFileName = false;
      this.operationType = "run";
    },
    // copy() {
    //   this.dialogVisible = true
    //   this.showFileName = false
    //   this.operationType = 'copy'
    // },
    tagChange(newTag) {
      newTag = this.cloneComponent(newTag);
      newTag.vModel = this.activeData.vModel;
      newTag.formId = this.activeId;
      newTag.span = this.activeData.span;
      delete this.activeData.tag;
      delete this.activeData.tagIcon;
      //   delete this.activeData.document;
      Object.keys(newTag).forEach(key => {
        if (
          this.activeData[key] !== undefined &&
          typeof this.activeData[key] === typeof newTag[key]
        ) {
          newTag[key] = this.activeData[key];
        }
      });
      this.activeData = newTag;
      this.updateDrawingList(newTag, this.drawingList);
    },
    updateDrawingList(newTag, list) {
      const index = list.findIndex(item => item.formId === this.activeId);
      if (index > -1) {
        list.splice(index, 1, newTag);
      } else {
        list.forEach(item => {
          if (Array.isArray(item.children))
            this.updateDrawingList(newTag, item.children);
        });
      }
    }
  }
};
</script>

<style lang="less">

@import './styles/home';

#ipad {
    height: 100%;
    display: flex;

  .outeripad, .ipadbody, .ipadscreen {
    position: relative;
    height: 100%;
  }

  .ipadcamera, .ipadhomebutton {
    position: absolute;
  }
}

/* iPad */
.outeripad {
  box-shadow: 0 0 13px 3px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  margin: auto;

  &.portrait{
      padding: 45px 25px;
      height: 85% !important;
      width: 74%;
      min-height: 560px;
  }

  &.landscape{
    width: 90%;
    padding: 25px 45px;
    height: 78% !important;

    .ipadcamera{
      left: -20px;
      top: 50%;
      margin-top: -10px;
    }

    .ipadhomebutton{
      margin-right: -38px;
      top: 50%;
      right: 0;
      left: unset;
      margin-top: -18px;
    }
  }

  .ipadbody {
    background-color: white;
    border-radius: 10px;
  }

  .ipadscreen {
    background-color: rgba(239, 239, 239, 0.6);
  }

  .ipadcamera {
    top: -38px;
    left: 50%;
    background-color: #aeaeae;
    height: 10px;
    width: 10px;
    border-radius: 5px;
    margin-top: 10px;
    margin-left: -5px;
  }

  .ipadhomebutton {
    background-color: #fff;
    height: 30px;
    width: 30px;
    border-radius: 15px;
    border: 1px solid #a8a8a8;
    margin-top: 6px;
    margin-left: -15px;
    left: 50%;
    cursor: pointer;
  }

  .el-radio-group {
    line-height: 2.5;
  }
}
.el-date-editor .el-range-separator{
  box-sizing: content-box;
}
</style>

<style lang="less" scoped>
.svg-icon {
  float: right;
}

</style>
