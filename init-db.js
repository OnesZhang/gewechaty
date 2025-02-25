const mysql = require('mysql2/promise')
const dotenv = require('dotenv')

// 加载环境变量
dotenv.config()

async function initDatabase() {
    let connection

    try {
        // 首先创建没有指定数据库的连接
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'root'
        })

        // 创建数据库
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'gewechaty'}`)
        console.log('数据库创建成功')

        // 使用新创建的数据库
        await connection.query(`USE ${process.env.DB_NAME || 'gewechaty'}`)

        // 创建联系人表
        await connection.query(`
      CREATE TABLE IF NOT EXISTS contact (
        id INT AUTO_INCREMENT PRIMARY KEY,
        wxid VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255),
        alias VARCHAR(255),
        type INT,
        gender INT,
        province VARCHAR(255),
        city VARCHAR(255),
        avatar_url TEXT,
        is_friend BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
        console.log('联系人表创建成功')

        // 创建群组表
        await connection.query(`
      CREATE TABLE IF NOT EXISTS room (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chatroom_id VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255),
        owner_id VARCHAR(255),
        announcement TEXT,
        member_list JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
        console.log('群组表创建成功')

        console.log('数据库初始化完成')
    } catch (err) {
        console.error('数据库初始化失败:', err)
        process.exit(1)
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

// 运行初始化
initDatabase() 