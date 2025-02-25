import koa from 'koa'
import koaRouter from 'koa-router'
const { bodyParser } = require("@koa/bodyparser");
import JSONbig from 'json-bigint'
import serve from 'koa-static'
import { join } from 'path';
import { login, reconnection } from '@/action/login.js'
import { cacheAllContact } from '@/action/contact'
import { setCached } from '@/action/common'
import { CheckOnline } from '@/api/login'
import { getLocalIPAddress, compareMemberLists, getAttributesFromXML } from "@/utils/index.js";
import { Message } from '@/class/MESSAGE.js'
import { Contact } from '@/class/CONTACT.js'
import { Room } from '@/class/ROOM.js'
import { botEmitter, roomEmitter } from '@/bot.js'
import { getAppId } from '@/utils/auth.js';
import { db } from '@/sql/index.js'
import { MessageType } from '@/type/MessageType'
import { RoomInvitation } from '@/class/ROOMINVITATION.js'
import { getRoomLiveInfo } from '@/action/room.js'
import { Friendship } from '@/class/FRIENDSHIP';
import dotenv from 'dotenv';

dotenv.config();

export const bot = botEmitter
export let staticUrl = 'static'
export let proxyUrl = ''
const ip = getLocalIPAddress()
const app = new koa()
const router = new koaRouter()
// 使用 bodyParser 解析 POST 请求的 body

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.use(bodyParser());


export const startServe = (option) => {
  // 启动服务
  var cbip = option.ip || ip;
  let callBackUrl = `http://${cbip}:${option.port}${option.route}`
  if (option.proxy) {
    callBackUrl = `${option.proxy}${option.route}`
  }
  proxyUrl = option.proxy
  // 设置文件保存目录
  app.use(serve(join(process.cwd(), option.static)))
  staticUrl = join(process.cwd(), option.static)


  // 定义一个接口，能够同时处理 GET 和 POST 请求
  router.post(option.route, async (ctx) => {
    try {
      const body = JSONbig({ storeAsString: true }).parse(ctx.request.rawBody); // 获取 POST 请求的 body 数据
      if (option.debug) {
        console.log(body);
      }
      // all 事件
      bot.emit('all', body)

      if (body && body.TypeName === 'Offline') {
        console.log('断线重连中...')
        const s = await reconnection()
        if (s) {
          console.log('断线重连成功')
        } else {
          console.log('断线重连失败,请重新登录！')
          process.exit(1);
        }
      }

      // 判断是否是微信消息
      if (body.Appid && body.TypeName === 'AddMsg') { // 大部分消息类型都为 AddMsg
        // 消息hanlder
        const msg = new Message(body)
        // 发送消息
        const type = msg.type()
        if (type === MessageType.RoomInvitation) { // 群邀请
          let obj = Message.getXmlToJson(msg.text())
          obj.fromId = msg.fromId
          bot.emit(`room-invite`, new RoomInvitation(obj))
        } else if (type === MessageType.AddFriend) { // 好友请求
          let obj = getAttributesFromXML(msg.text())
          bot.emit('friendship', new Friendship(obj))
        } else if (type === MessageType.Revoke) { // 消息撤回
          bot.emit('revoke', msg)
        } else {
          bot.emit('message', msg)
        }
      } else if (body && body.TypeName === 'ModContacts') { // 好友消息， 群信息变更
        // 消息hanlder
        const id = body.Data?.UserName?.string || ''
        if (id.endsWith('@chatroom')) { // 群消息
          const oldInfo = db.findOneByChatroomId(id)
          const newInfo = await getRoomLiveInfo(id)
          // 群聊200人以上无法直接扫码进群，需要邀请，因此增加特殊处理
          if (oldInfo.memberList.length >= 200 || body.Data?.ImgFlag != 1) {
            // 比较成员列表
            const obj = compareMemberLists(oldInfo.memberList, newInfo.memberList)
            if (obj.added.length > 0) {
              obj.added.map((item) => {
                const member = new Contact(item)
                roomEmitter.emit(`join:${id}`, new Room(newInfo), member, member.inviterUserName)
              })
            }
            if (obj.removed.length > 0) {
              obj.removed.map((item) => {
                const member = new Contact(item)
                roomEmitter.emit(`leave:${id}`, new Room(newInfo), member)
              })
            }

            if (body.Data.NickName.string !== oldInfo.nickName) { // 群名称变动
              roomEmitter.emit(`topic:${id}`, new Room(newInfo), body.Data.NickName.string, oldInfo.nickName)
            }
            db.updateRoom(id, newInfo)
          }
        }
      } else {
        bot.emit('other', body)
      }

      // "TypeName": "ModContacts", 好友消息， 群信息变更 
      // "TypeName": "DelContacts" 删除好友
      // "TypeName": "DelContacts" 退出群聊

    } catch (e) {
      console.error(e)
    }
    ctx.body = "SUCCESS";
  }).get(option.route, (ctx) => {
    const query = ctx.request.query; // 获取 GET 请求的 query 参数
    console.log('GET 请求的数据:', query);
    ctx.body = "SUCCESS";
  });

  // app.use(bodyParser());



  return new Promise((resolve, reject) => {
    app.listen(option.port, async (err) => {
      if (err) {
        reject(err)
        process.exit(1);
      }

      try {
        setCached(true)

        // 初始化数据库连接
        try {
          await db.connect();
          // 创建必要的表
          await db.createContactTable();
          await db.createRoomTable();

          // 缓存所有联系人
          console.log('本地数据初始化，可能需要耗费点时间，耐心等待...')
          await delay(1000) // 防止异步
          await cacheAllContact()
          console.log('数据初始化完毕')
        } catch (error) {
          console.error('数据库初始化失败:', error);
          process.exit(1);
        }

        // 启用路由
        app.use(router.routes())
        app.use(router.allowedMethods())

        console.log('服务启动成功')
        resolve({ app, router })
      } catch (error) {
        console.error('服务启动失败:', error);
        reject(error)
        process.exit(1);
      }
    });
  });
}
