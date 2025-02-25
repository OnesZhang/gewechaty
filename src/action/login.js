import { Logout, Reconnection } from "@/api/login.js";
import { getAppId } from '@/utils/auth.js';

export const login = async () => {
  // 直接返回true，因为现在使用外部微信服务的回调
  return true;
}

export const logout = async () => {
  try {
    const res = await Logout({
      appId: getAppId()
    })
    if (res.ret === 200) {
      return true
    } else {
      return false
    }
  } catch (e) {
    console.error(e)
    return false
  }
}

export const reconnection = async () => {
  try {
    const res = await Reconnection({
      appId: getAppId()
    })
    if (res.ret === 200) {
      return true
    } else {
      return false
    }
  } catch (e) {
    console.error(e)
    return false
  }
}