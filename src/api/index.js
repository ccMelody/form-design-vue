import request from '@/axios';

// 流程图的数据
export const getProcessData = (accountbookId,billType) => {
  return request({
    url:  'oaBillConfigController.do?getProcessConfig',
    method: 'get',
    params:{
      accountbookId,
      billType
    }
  })
}