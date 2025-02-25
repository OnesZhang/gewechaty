# gewechaty

## 基于Gewechaty改造，接入官方 geweapi.com，使用mysql数据库

# 以下简介来自gewechaty，暂未完全更新

## 一、简介

gewechaty 是基于[Gewechat](https://github.com/Devo919/Gewechat?tab=readme-ov-file)项目的二次封装，提供了更方便的使用方式。参考 wechaty 的 api 实现，以满足更快速开发的需求（由于gewechat接口限制无法完全平滑迁移只是提供更便捷的使用方法，如有些同步的方法需要改为异步）。

本项目基于 [Gewechat](https://github.com/Devo919/Gewechat?tab=readme-ov-file)，请先确认 Gewechat 已经能够正常启动，否则无法使用本插件。

- 项目不断完善中，请务必使用最新版本。
- 将在项目运行根目录创建一个ds.json 用于存储 appid token 和uuid，用于缓存联系人和群信息，以确保可以使用联系人昵称和群名称查询相关信息，无需直接使用wxid查询， 如果确实需要使用wxid查询可以直接传入wxid，如`bot.Contact.find({id: 'wxid_xxxx'})`。
- 注意如果本地没有ds.json文件将会以空的appid向gewechat发起新的登录请求，如果你已经登录了gewechat不想退出登录可以自行构建一个ds.json文件。结构如下：(如未保存这些信息，建议直接手机退出登录后直接运行项目，将会唤起重新登录流程)

```json
{
    "token": "f4e4dd8d4ff148*************",
    "appid": "wx_*****************",
    "uuid": "************" 
}
```

## 二、环境要求

- Node.js >= 16.0.0
- MySQL >= 5.7

## 三、数据库配置

在项目根目录创建 `.env` 文件，配置以下环境变量：

```env
# 数据库配置
DB_HOST=localhost    # 数据库主机地址
DB_PORT=3306        # 数据库端口号
DB_USER=root        # 数据库用户名
DB_PASSWORD=your_password   # 数据库密码
DB_NAME=gewechaty   # 数据库名称

# 其他配置
NODE_ENV=development
```

## 四、安装

使用以下命令安装本插件：

```bash
npm install --save gewechaty
```

## 五、使用方法

### 1. 导入插件

在你的 Node.js 项目中，使用以下方式导入插件：

```javascript
import { Wechaty } from 'gewechaty'

const bot = new Wechaty()

bot.on('scan', (qrcode, status) => {
  // 处理扫码事件
})

bot.on('login', (user) => {
  // 处理登录事件
})

bot.on('message', (msg) => {
  // 处理消息事件
})

bot.start()
```

### 2. 数据库操作

本项目使用 MySQL 数据库存储联系人和群组信息。主要表结构如下：

- contact：存储联系人信息
- room：存储群组信息

可以通过 `bot.db` 对象访问数据库操作方法，例如：

```javascript
// 查询联系人
const contact = await bot.db.findOneByWxId('wxid_xxx')

// 查询群组
const room = await bot.db.findOneByChatroomId('xxx@chatroom')

// 更多数据库操作方法请参考源码
```

## 六、配置选项

如果插件有可配置的选项，可以在此部分进行说明，例如：

```javascript
const bot = new GeweBot({
  debug: true, // 是否开启调试模式 默认false 开启调试将在控制台输出回调接口接收到的内容
  port: 3000, // 本地服务端口 默认3000
  proxy: process.env.WEGE_LOCAL_PROXY, // 本地代理地址，用于gewechat的docker在云时无法访问本地时使用 可为空 如果有则使用代理 否则使用本机ip地址例如 （http://proxy.domain.com:3000）注意需要跟上端口号
  static: "static", // 本机静态托管的目录 用于文件下载和上传 默认为static
  route: "/getWechatCallBack", // 本地回调接口route 默认为 `/getWechatCallBack` 最终地址为 `http://本机ip:port/getWechatCallBack`
  base_api: process.env.WEGE_BASE_API_URL, // 基础api地址base_api 默认为 `http://本机ip:2531/v2/api`
  file_api: process.env.WEGE_FILE_API_URL, // 文件api地址base_api 默认为 `http://本机ip:2532/download`,
  data_dir: './data', // 数据存储路径 默认为工作目录下的data文件夹
});
// 如果docker 和GeweBot在同一台电脑上 可以直接使用 new GeweBot() 即可
```

### GeweBot 类方法介绍

| **方法名**                | **返回值类型** | **描述**                                                    |
| ------------------------- | -------------- | ----------------------------------------------------------- |
| `start()`                 | `Promise`      | 启动服务                                                    |
| `on(eventName, callback)` | `void`         | 监听指定事件，`eventName` 为事件名，`callback` 为回调函数。 |
| `logout()`                | `boolean`      | 退出登录                                                    |
| `info()`                  | `Promise`      | 获取当前登录用户的个人信息。                                |
| `qrcode()`                | `Promise`      | 获取当前用户的二维码。                                      |
| `getAppId()`              | `string`       | 获取 `appId`。                                              |
| `getToken()`              | `string`       | 获取 `token`。                                              |
| `getUuid()`               | `string`       | 获取 `uuid`。                                               |
| `setInfo(info)`           | `void`         | 设置用户的个人信息，`info` 为用户信息对象。                 |
| `setPrivacy(privacy)`     | `void`         | 设置隐私信息，`privacy` 为隐私设置对象。                    |
| `setAvatar(avatar)`       | `void`         | 设置用户的头像，`avatar` 为头像图片的路径或 URL。           |
| `deviceList()`            | `Promise`      | 获取用户设备列表。                                          |



### Message 类方法表

| **方法名**                            | **返回值类型**         | **说明**                                                |
| ------------------------------------- | ---------------------- | ------------------------------------------------------- |
| `isCompanyMsg()`                      | `boolean`              | 判断消息是否为企业微信消息。                            |
| `from()`                              | `Promise<Contact>`     | 获取消息的发送者。                                      |
| `to()`                                | `Promise<Contact>`     | 获取消息的接收者。                                      |
| `room()`                              | `Promise<Room>`        | 获取群信息。                                            |
| `text()`                              | `string`               | 获取消息的内容。                                        |
| `async say(textOrContactOrFileOrUrl)` | `Promise<ResponseMsg>` | 回复消息。                                              |
| `type()`                              | `string`               | 获取消息的类型。参考 MessageType                        |
| `self()`                              | `boolean`              | 判断是否为自己发的消息。                                |
| `async mentionSelf()`                 | `Promise`              | 判断是否自己被@。                                       |
| `async forward(Contact)`              | `Promise`              | 转发消息。                                              |
| `async quote(text)`                   | `Promise`              | 引用消息（传入一个字符串）。                            |
| `date()`                              | `Date`                 | 获取消息的日期。                                        |
| `age()`                               | `number`               | 获取消息的年龄（以秒为单位）。                          |
| `async toFileBox(type = 2)`           | `Promise<FileBox>`     | 将消息转换为 FileBox 对象，用于图片消息type为图片质量。 |
| `getXml2Json(xml)`                    | `Object`               | 将 XML 解析为 JSON 对象。                               |
| `static async find(query)`            | `Promise<Contact>`     | (由于未保存聊天信息，暂不支持)                          |
| `static async findAll(queryArgs)`     | `Promise<[Contact]>`   | （由于未保存聊天信息，暂不支持 ）                       |


### ResponseMsg 类属性和方法表

| **方法名** | **返回值类型** | **说明**   |
| ---------- | -------------- | ---------- |
| `revoke()` | `Promise`      | 撤回消息。 |

### Contact 类方法表

| **方法名**                            | **返回值类型** | **说明**                                                                           |
| ------------------------------------- | -------------- | ---------------------------------------------------------------------------------- |
| `async say(textOrContactOrFileOrUrl)` | `Promise`      | 回复消息，返回 `ResponseMsg` 对象，可用于撤回消息。                                |
| `name()`                              | `string`       | 获取联系人的昵称。                                                                 |
| `async alias(newAlias)`               | `Promise`      | 获取或设置联系人的备注名。传递 `newAlias` 时设置新的备注名，否则返回当前的备注名。 |
| `friend()`                            | `boolean`      | 返回是否为微信好友。当前固定为 tue                                                 |
| `type()`                              | `number`       | 返回联系人的类型。                                                                 |
| `gender()`                            | `number`       | 返回联系人的性别。                                                                 |
| `province()`                          | `string`       | 返回联系人的省份信息。                                                             |
| `city()`                              | `string`       | 返回联系人的城市信息。                                                             |
| `async avatar()`                      | `Promise`      | 返回联系人的头像 URL。                                                             |
| `async sync()`                        | `Promise`      | 同步联系人信息，同步后会自动更新本地缓存。                                         |
| `self()`                              | `boolean`      | 判断该联系人是否为当前用户自己。                                                   |

### Contact 类静态方法表

| **方法名**                 | **返回值类型**     | **说明**                                                |
| -------------------------- | ------------------ | ------------------------------------------------------- |
| `static async find(query)` | `Promise<Contact>` | 根据查询条件查找联系人。（query 为 wxid 或 Contact 类） |
| `static async findAll()`   | `Promise`          | 查找通讯录列表返回所有好友 wxid 列表                    |

### Room 类方法说明

| **方法名**                              | **返回值类型**         | **说明**                     |
| --------------------------------------- | ---------------------- | ---------------------------- |
| `async sync()`                          | `Promise`              | 同步房间信息                 |
| `async say(textOrContactOrFileOrUrl)`   | `Promise<ResponseMsg>` | 发送消息到房间               |
| `async add(contact)`                    | `Promise`              | 添加成员到房间               |
| `async del(contact)`                    | `Promise`              | 删除房间成员                 |
| `async quit()`                          | `Promise`              | 退出房间                     |
| `async topic(string)`                   | `Promise<string>`      | 修改房间话题，或获取当前话题 |
| `async announce(string)`                | `Promise`              | 获取或设置房间公告           |
| `async qrcode()`                        | `Promise`              | 获取房间的二维码             |
| `async alias(contact)`                  | `Promise<string>`      | 获取成员别名                 |
| `async has(contact)`                    | `Promise<boolean>`     | 检查房间是否有某个成员       |
| `async memberAll(string)`               | `Promise<[Contact]>`   | 获取所有成员或符合查询的成员 |
| `async member(string)`                  | `Promise<Contact>`     | 获取单个成员                 |
| `async owner()`                         | `Promise<Contact>`     | 获取房间的拥有者             |
| `async avatar()`                        | `Promise<FileBox>`     | 获取房间头像                 |
| `async create([contact], roomName)`     | `Promise`              | 创建新房间                   |
| `async findAll({name: 'name'} or null)` | `Promise<[Room]>`      | 查询符合条件的房间           |
| `async find({name: 'name'})`            | `Promise<Room>`        | 查询单个符合条件的房间       |


### Filebox 类方法说明

| **方法名**                           | **返回值类型**  | **说明**                         |
| ------------------------------------ | --------------- | -------------------------------- |
| `static fromUrl(url)`                | `Filebox`       | 从 URL 创建一个 Filebox 实例     |
| `static fromFile(filepath)`          | `Filebox`       | 从文件路径创建实例               |
| `static toDownload(url, type, name)` | `Filebox`       | 从 URL 创建可下载的 Filebox 实例 |
| `toFile(dest)`                       | `Promise<void>` | 将实例文件下载到指定路径         |
| `static getFileType(fileName)`       | `string`        | 根据文件名返回文件类型           |


### MessageType 类型表

| **类型**         | **说明**     |
| ---------------- | ------------ |
| `Unknown`        | 未知类型     |
| `FileStart`      | 文件开始     |
| `File`           | 文件发送结束 |
| `Voice`          | 语音         |
| `Contact`        | 名片         |
| `Emoji`          | 表情         |
| `Image`          | 图片         |
| `Text`           | 文本         |
| `Video`          | 视频         |
| `Url`            | 链接         |
| `RoomInvitation` | 群邀请       |
| `MiniApp`        | 小程序消息   |
| `AppMsg`         | app 消息     |
| `Link`           | 公众号链接   |
| `AddFriend`      | 添加好友通知 |
| `Quote`          | 引用消息     |
| `Transfer`       | 转账         |
| `RedPacket`      | 红包         |
| `VideoAccount`   | 视频号消息   |
| `Revoke`         | 撤回消息     |
| `Pat`            | 拍一拍       |
| `Location`       | 位置消息     |

### Friendship 类方法表

| **方法名**                                | **返回值类型**        | **说明**                                         |
| ----------------------------------------- | --------------------- | ------------------------------------------------ |
| `accept()`                                | `Promise`             | 接受好友请求。                                   |
| `reject(content)`                         | `Promise`             | 拒绝好友请求。                                   |
| `hello()`                                 | `string`              | 获取好友请求的内容。                             |
| `contact()`                               | `Contact`             | 获取好友的联系人信息。                           |
| `type()`                                  | `number`              | 获取好友请求的来源类型（如微信号搜索、群聊等）。 |
| `static async search(mobile)`             | `Promise<Friendship>` | 根据手机号搜索联系人。                           |
| `static async add(contact, helloMessage)` | `Promise`             | 添加联系人，发送好友请求。                       |


### RoomInvitation 类方法表

| **方法名**  | **返回值类型**     | **说明**                              |
| ----------- | ------------------ | ------------------------------------- |
| `accept()`  | `Promise<void>`    | 接受房间邀请。                        |
| `inviter()` | `Promise<Contact>` | 获取邀请人，返回一个 `Contact` 对象。 |
| `topic()`   | `Promise<string>`  | 获取房间邀请的主题。                  |
| `date()`    | `Promise<Date>`    | 获取房间邀请的日期和时间。            |
| `age()`     | `Promise<number>`  | 获取邀请的年龄（以秒为单位）。        |


免责声明【必读】

- 本框架仅供学习和技术研究使用，不得用于任何商业或非法行为，否则后果自负。

- 本框架的作者不对本工具的安全性、完整性、可靠性、有效性、正确性或适用性做任何明示或暗示的保证，也不对本工具的使用或滥用造成的任何直接或间接的损失、责任、索赔、要求或诉讼承担任何责任。

- 本框架的作者保留随时修改、更新、删除或终止本工具的权利，无需事先通知或承担任何义务。

- 本框架的使用者应遵守相关法律法规，尊重微信的版权和隐私，不得侵犯微信或其他第三方的合法权益，不得从事任何违法或不道德的行为。

- 本框架的使用者在下载、安装、运行或使用本工具时，即表示已阅读并同意本免责声明。如有异议，请立即停止使用本工具，并删除所有相关文件。



## 七、贡献

如果你想为这个插件做出贡献，可以按照以下步骤进行：

1. Fork 本仓库。
2. 创建一个新的分支进行你的修改。
3. 提交你的修改并创建一个 pull request。

## License

This project is licensed under the MIT License - see the [MIT License](./LICENSE) file for details.

---
