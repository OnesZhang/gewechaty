// 仅在非生产环境下加载.env文件
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const fs = require('fs');
const path = require('path');
const { GeweBot, Filebox, UrlLink, WeVideo, Voice, MiniApp, AppMsg, Message } = require('./dist/index.js');

// 创建日志目录
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// 创建文件下载目录结构
const staticDir = process.env.STATIC_DIR || 'static';
const downloadDir = path.join(process.cwd(), staticDir, 'download');
const imageDir = path.join(downloadDir, 'images');
const videoDir = path.join(downloadDir, 'videos');
const voiceDir = path.join(downloadDir, 'voices');
const fileDir = path.join(downloadDir, 'files');

// 确保目录存在
[downloadDir, imageDir, videoDir, voiceDir, fileDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// 获取文件保存路径
const getDownloadPath = (type, filename) => {
    const typeMap = {
        'image': imageDir,
        'video': videoDir,
        'voice': voiceDir,
        'file': fileDir
    };
    return path.join(typeMap[type] || fileDir, filename);
};

// 日志记录函数
const logToFile = (type, content) => {
    if (!process.env.WEGE_DEBUG) return;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toISOString().split('T')[1].replace(/:/g, '-').split('.')[0];
    const logFile = path.join(logsDir, `${dateStr}.log`);

    const logContent = `[${now.toISOString()}] [${type}] ${typeof content === 'object' ? JSON.stringify(content, null, 2) : content}\n`;

    fs.appendFileSync(logFile, logContent, 'utf8');
};

// 创建机器人实例
const bot = new GeweBot({
    debug: process.env.WEGE_DEBUG === 'true', // 开启调试模式，可以在控制台看到更多信息
    base_api: process.env.WEGE_BASE_API_URL, // Gewechat启动后的基础api地址
    file_api: process.env.WEGE_FILE_API_URL, // Gewechat启动后的文件api地址
    port: parseInt(process.env.PORT || '3000'), // 本地服务端口
    static: process.env.STATIC_DIR || 'static', // 静态文件目录
    route: process.env.WEGE_CALLBACK_ROUTE || '/getWechatCallBack', // 回调地址路由
    proxy: process.env.WEGE_LOCAL_PROXY, // 本地代理地址，用于Docker访问宿主机服务
});

// 监听消息事件
bot.on('message', async (msg) => {
    try {
        // 打印消息类型
        console.log('消息类型:', msg.type());

        // 获取发送者信息
        const contact = await msg.from();
        console.log('发送者:', contact.name());

        // 如果是群消息
        const room = await msg.room();
        if (room) {
            console.log('来自群:', await room.topic());
            // 如果被@了
            if (await msg.mentionSelf()) {
                await msg.say('谢谢@我');
            }
        }

        // 处理不同类型的消息
        switch (msg.type()) {
            case bot.Message.Type.Text:
                const text = msg.text();
                console.log(`收到文本消息: ${text}`);

                // 测试引用回复
                await msg.quote(`收到你的消息: ${text}`);

                // 测试发送链接卡片
                if (text === '发送链接') {
                    const urlLink = new UrlLink({
                        description: "这是一个测试链接",
                        thumbnailUrl: "https://www.example.com/thumb.jpg",
                        title: "测试链接",
                        url: "https://www.example.com",
                    });
                    await msg.say(urlLink);
                }
                break;

            case bot.Message.Type.Image:
                console.log('收到图片消息');
                try {
                    // 下载图片
                    const image = await msg.toFileBox();
                    const downloadPath = getDownloadPath('image', image.name);
                    await image.toFile(downloadPath);
                    logToFile('FILE_DOWNLOAD', `图片已下载到: ${downloadPath}`);

                    // 回复图片使用本地文件
                    const imageToSend = Filebox.fromUrl(`${bot.proxy}/download/images/${image.name}`);
                    await msg.say(imageToSend);
                } catch (e) {
                    logToFile('ERROR', `处理图片消息失败: ${e.message}`);
                }
                break;

            case bot.Message.Type.Video:
                console.log('收到视频消息');
                logToFile('MESSAGE', '收到视频消息');
                break;

            case bot.Message.Type.Voice:
                console.log('收到语音消息');
                logToFile('MESSAGE', '收到语音消息');
                break;

            case bot.Message.Type.File:
                console.log('收到文件消息');
                logToFile('MESSAGE', '收到文件消息');
                break;

            case bot.Message.Type.Contact:
                console.log('收到名片消息');
                const shareContact = await msg.toContact();
                await msg.say(`收到名片: ${shareContact.name()}`);
                break;

            case bot.Message.Type.MiniApp:
                console.log('收到小程序消息');
                // 回复一个小程序
                const miniApp = new MiniApp({
                    title: "测试小程序",
                    username: "gh_xxxxxxxx",
                    miniAppId: "wx1234567890",
                    coverImgUrl: "https://example.com/miniapp.jpg",
                    pagePath: "pages/index/index",
                    displayName: "测试应用"
                });
                await msg.say(miniApp);
                break;

            default:
                if (process.env.WEGE_DEBUG) {
                    const logData = {
                        type: msg.type(),
                        messageDetails: msg
                    };
                    logToFile('UNSUPPORTED_MESSAGE', logData);
                }
                break;
        }
    } catch (e) {
        logToFile('ERROR', `处理消息时发生错误: ${e.message}\n${e.stack}`);
        console.error('处理消息时发生错误:', e);
    }
});

// 监听好友请求事件
bot.on('friendship', async (friendship) => {
    try {
        const type = friendship.type();
        const contact = friendship.contact();
        logToFile('FRIENDSHIP', `收到好友请求，类型: ${type}, 用户: ${contact.name()}`);

        // 如果是验证消息匹配，自动通过
        if (friendship.hello() === 'ding') {
            await friendship.accept();
            await contact.say('你好，很高兴认识你！');
            logToFile('FRIENDSHIP', `自动通过好友请求: ${contact.name()}`);
        }
    } catch (e) {
        logToFile('ERROR', `处理好友请求时发生错误: ${e.message}\n${e.stack}`);
        console.error('处理好友请求时发生错误:', e);
    }
});

// 监听群邀请事件
bot.on('room-invite', async (roomInvitation) => {
    try {
        const inviter = await roomInvitation.inviter();
        const topic = await roomInvitation.topic();
        logToFile('ROOM_INVITE', `收到群邀请，邀请人: ${inviter.name()}, 群名: ${topic}`);

        await roomInvitation.accept();
        logToFile('ROOM_INVITE', `自动接受群邀请: ${topic}`);
    } catch (e) {
        logToFile('ERROR', `处理群邀请时发生错误: ${e.message}\n${e.stack}`);
        console.error('处理群邀请时发生错误:', e);
    }
});

// 监听扫码事件
bot.on('scan', qrcode => {
    logToFile('SCAN', `需要扫码登录，二维码内容：${qrcode.content}`);
    console.log('需要扫码登录，请打开下面的链接查看二维码：');
    console.log(qrcode.content);
});

// 监听所有事件，用于调试
bot.on('all', msg => {
    if (process.env.WEGE_DEBUG) {
        logToFile('RAW_EVENT', msg);
    }
});

// 启动机器人
bot.start()
    .then(({ app, router }) => {
        logToFile('SYSTEM', '机器人启动成功');
        console.log('机器人启动成功');

        // 添加一个HTTP接口用于发送消息
        router.get('/sendMessage', async (ctx) => {
            try {
                const { to, message } = ctx.query;
                if (!to || !message) {
                    ctx.body = { success: false, error: '缺少必要参数' };
                    return;
                }

                const contact = await bot.Contact.find({ name: to });
                if (!contact) {
                    ctx.body = { success: false, error: '找不到联系人' };
                    return;
                }

                await contact.say(message);
                ctx.body = { success: true, message: '发送成功' };
            } catch (e) {
                ctx.body = { success: false, error: e.message };
            }
        });

        app.use(router.routes()).use(router.allowedMethods());
    })
    .catch(e => {
        console.error('机器人启动失败：', e);
    }); 