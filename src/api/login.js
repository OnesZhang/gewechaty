import { post } from '@/request/request.js'

export const CheckOnline = (data, config = {}) => {
  Object.assign(config, {
    allCode: true
  })
  return post('/login/checkOnline', data, config)
}

export const Logout = (data, config = {}) => {
  Object.assign(config, {
    allCode: true
  })
  return post('/login/logout', data, config)
}

export const Reconnection = (data, config = {}) => {
  Object.assign(config, {
    allCode: true
  })
  return post('/login/reconnection', data, config)
}

// export const MobileRegist = (data: MobileRegistParams, config: configParams = {}) => {
//   data.passWord = setPassword(data.passWord)
//   return basePost(`/auth/register`, data, config)
// }