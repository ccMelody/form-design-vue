import Amount from './Amount';//金额
import Calculation from './Calculation';//计算公式
import TimeDuration from './TimeDuration';//时间范围选择
import DateDuration from './DateDuration';//日期范围选择
import OrgTransfer from './OrgTransfer';//组织结构内部调用的选择人员的弹窗
import OrgSelect from './OrgSelect';//组织结构组件
import InputTable from './InputTable';//预览页面上展示的table
const components = [
  Amount,
  Calculation,
  TimeDuration,
  DateDuration,
  OrgTransfer,
  OrgSelect,
  InputTable
]

const install = function ( Vue ) {
  components.map( component => {
    Vue.component( component.name, component )
  } )
}

export default {
  install
}