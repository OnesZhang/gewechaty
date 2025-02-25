const { GeweBot } = require('./dist/index.js')
const dotenv = require('dotenv')
const path = require('path')

// 加载环境变量
dotenv.config()

// 检查必要的环境变量
if (!process.env.WEGE_BASE_API_URL) {
    console.error('错误: 环境变量 WEGE_BASE_API_URL 未设置')
    process.exit(1)
}

if (!process.env.WEGE_TOKEN) {
    console.error('错误: 环境变量 WEGE_TOKEN 未设置')
    process.exit(1)
}

if (!process.env.WEGE_APP_ID) {
    console.error('错误: 环境变量 WEGE_APP_ID 未设置')
    process.exit(1)
}

async function main() {
    try {
        // 创建机器人实例
        const bot = new GeweBot({
            port: 3000,                    // 服务端口
            static: 'static',              // 静态文件目录
            route: '/getWechatCallBack',   // 回调路由
            debug: true,                   // 开启调试模式
            data_dir: path.join(__dirname, 'data'),  // 数据存储目录
            appId: process.env.WEGE_APP_ID  // 设备ID
        })

        // 启动机器人
        await bot.start()
        console.log('机器人启动成功！')

        // 尝试登录
        const loginSuccess = await bot.login()
        if (!loginSuccess) {
            console.error('登录失败')
            process.exit(1)
        }
        console.log('登录成功！')

        // 获取个人信息
        const userInfo = await bot.info()
        console.log('当前登录用户信息:', userInfo)

        // 监听消息事件
        bot.on('message', async (msg) => {
            try {
                const text = msg.text()      // 消息内容
                const type = msg.type()      // 消息类型
                const from = await msg.from() // 发送者
                const room = await msg.room() // 是否是群消息

                console.log('收到消息:', {
                    text,
                    type,
                    from: from ? {
                        name: from.name(),
                        alias: await from.alias()
                    } : null,
                    room: room ? {
                        topic: await room.topic()
                    } : null
                })

                // 如果是文本消息，可以回复
                if (type === 'text') {
                    await msg.say('收到消息：' + text)
                }
            } catch (err) {
                console.error('处理消息错误:', err)
            }
        })

        // 监听好友请求
        bot.on('friendship', async (friendship) => {
            try {
                console.log('收到好友请求:', {
                    hello: friendship.hello(),
                    contact: friendship.contact()
                })
                // 自动通过好友请求
                await friendship.accept()
            } catch (err) {
                console.error('处理好友请求错误:', err)
            }
        })

        // 监听群邀请
        bot.on('room-invite', async (invitation) => {
            try {
                console.log('收到群邀请')
                // 自动通过群邀请
                await invitation.accept()
            } catch (err) {
                console.error('处理群邀请错误:', err)
            }
        })

        // 监听所有事件（调试用）
        if (bot.debug) {
            bot.on('all', (payload) => {
                console.log('收到事件:', payload)
            })
        }

    } catch (err) {
        console.error('机器人运行错误:', err)
        process.exit(1)
    }
}

// 运行主函数
main() 