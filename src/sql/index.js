import mysql from 'mysql2/promise';

class myDB {
  constructor() {
    this.pool = null;
  }

  async connect() {
    if (!this.pool) {
      this.pool = await mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root',
        database: process.env.DB_NAME || 'gewechaty',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4'
      });
      console.log('Connected to MySQL database');
    }
    return this.pool;
  }

  async createContactTable() {
    const tableName = 'contact';
    const tableSchema = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        userName VARCHAR(255) PRIMARY KEY,
        nickName VARCHAR(255),
        pyInitial VARCHAR(255),
        quanPin VARCHAR(255),
        sex INT,
        remark VARCHAR(255),
        remarkPyInitial VARCHAR(255),
        remarkQuanPin VARCHAR(255),
        signature TEXT,
        alias VARCHAR(255),
        snsBgImg TEXT,
        country VARCHAR(255),
        bigHeadImgUrl TEXT,
        smallHeadImgUrl TEXT,
        description TEXT,
        cardImgUrl TEXT,
        labelList TEXT,
        province VARCHAR(255),
        city VARCHAR(255),
        phoneNumList TEXT
      )
    `;

    try {
      const pool = await this.connect();
      await pool.query(tableSchema);
      console.log(`Table ${tableName} is ready.`);
    } catch (err) {
      console.error('Error creating contact table:', err);
      throw err;
    }
  }

  async createRoomTable() {
    const tableName = 'room';
    const tableSchema = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        chatroomId VARCHAR(255) PRIMARY KEY,
        nickName VARCHAR(255),
        pyInitial VARCHAR(255),
        quanPin VARCHAR(255),
        sex INT,
        remark VARCHAR(255),
        remarkPyInitial VARCHAR(255),
        remarkQuanPin VARCHAR(255),
        chatRoomNotify INT,
        chatRoomOwner VARCHAR(255),
        smallHeadImgUrl TEXT,
        memberList TEXT
      )
    `;

    try {
      const pool = await this.connect();
      await pool.query(tableSchema);
      console.log(`Table ${tableName} is ready.`);
    } catch (err) {
      console.error('Error creating room table:', err);
      throw err;
    }
  }

  async findOneByWxId(wxid) {
    try {
      const pool = await this.connect();
      const [rows] = await pool.query('SELECT * FROM contact WHERE userName = ?', [wxid]);
      return rows.length > 0 ? rows[0] : null;
    } catch (err) {
      console.error('Error finding contact by wxid:', err);
      throw err;
    }
  }

  async findOneByName(nickName) {
    try {
      const pool = await this.connect();
      const [rows] = await pool.query('SELECT * FROM contact WHERE nickName = ?', [nickName]);
      return rows.length > 0 ? rows[0] : null;
    } catch (err) {
      console.error('Error finding contact by name:', err);
      throw err;
    }
  }

  async findAllByName(nickName) {
    try {
      const pool = await this.connect();
      const [rows] = await pool.query('SELECT * FROM contact WHERE nickName = ?', [nickName]);
      return rows.length > 0 ? rows : null;
    } catch (err) {
      console.error('Error finding all contacts by name:', err);
      throw err;
    }
  }

  async findOneByAlias(alias) {
    try {
      const pool = await this.connect();
      const [rows] = await pool.query('SELECT * FROM contact WHERE remark = ?', [alias]);
      return rows.length > 0 ? rows[0] : null;
    } catch (err) {
      console.error('Error finding contact by alias:', err);
      throw err;
    }
  }

  async findAllByAlias(alias) {
    try {
      const pool = await this.connect();
      const [rows] = await pool.query('SELECT * FROM contact WHERE remark = ?', [alias]);
      return rows.length > 0 ? rows : null;
    } catch (err) {
      console.error('Error finding all contacts by alias:', err);
      throw err;
    }
  }

  async findOneByChatroomId(chatroomId) {
    try {
      const pool = await this.connect();
      const [rows] = await pool.query('SELECT * FROM room WHERE chatroomId = ?', [chatroomId]);
      const row = rows.length > 0 ? rows[0] : null;
      if (row && row.memberList) {
        row.memberList = JSON.parse(row.memberList);
      }
      return row;
    } catch (err) {
      console.error('Error finding room by chatroomId:', err);
      throw err;
    }
  }

  async findOneByChatroomName(name) {
    try {
      const pool = await this.connect();
      const [rows] = await pool.query('SELECT * FROM room WHERE nickName = ?', [name]);
      return rows.length > 0 ? rows[0] : null;
    } catch (err) {
      console.error('Error finding room by name:', err);
      throw err;
    }
  }

  async findAllByChatroomName(name) {
    try {
      const pool = await this.connect();
      const [rows] = await pool.query('SELECT * FROM room WHERE nickName = ?', [name]);
      return rows.length > 0 ? rows : null;
    } catch (err) {
      console.error('Error finding all rooms by name:', err);
      throw err;
    }
  }

  async insertContact(contact) {
    if (!contact.userName) {
      return;
    }

    try {
      const pool = await this.connect();
      const sql = `
        INSERT INTO contact (
          userName, nickName, pyInitial, quanPin, sex, remark, remarkPyInitial,
          remarkQuanPin, signature, alias, snsBgImg, country, bigHeadImgUrl,
          smallHeadImgUrl, description, cardImgUrl, labelList, province, city, phoneNumList
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          nickName = VALUES(nickName),
          pyInitial = VALUES(pyInitial),
          quanPin = VALUES(quanPin),
          sex = VALUES(sex),
          remark = VALUES(remark),
          remarkPyInitial = VALUES(remarkPyInitial),
          remarkQuanPin = VALUES(remarkQuanPin),
          signature = VALUES(signature),
          alias = VALUES(alias),
          snsBgImg = VALUES(snsBgImg),
          country = VALUES(country),
          bigHeadImgUrl = VALUES(bigHeadImgUrl),
          smallHeadImgUrl = VALUES(smallHeadImgUrl),
          description = VALUES(description),
          cardImgUrl = VALUES(cardImgUrl),
          labelList = VALUES(labelList),
          province = VALUES(province),
          city = VALUES(city),
          phoneNumList = VALUES(phoneNumList)
      `;

      await pool.query(sql, [
        contact.userName || null,
        contact.nickName || null,
        contact.pyInitial || null,
        contact.quanPin || null,
        contact.sex || null,
        contact.remark || null,
        contact.remarkPyInitial || null,
        contact.remarkQuanPin || null,
        contact.signature || null,
        contact.alias || null,
        contact.snsBgImg || null,
        contact.country || null,
        contact.bigHeadImgUrl || null,
        contact.smallHeadImgUrl || null,
        contact.description || null,
        contact.cardImgUrl || null,
        contact.labelList || null,
        contact.province || null,
        contact.city || null,
        contact.phoneNumList || null
      ]);

      console.log(`缓存联系人: ${contact.userName}`);
    } catch (err) {
      console.error('Error inserting contact:', err);
      throw err;
    }
  }

  async updateContact(userName, newData) {
    try {
      const pool = await this.connect();
      const existingContact = await this.findOneByWxId(userName);
      if (!existingContact) {
        console.log(`Contact ${userName} does not exist.`);
        return;
      }

      const sql = `
        UPDATE contact SET
          nickName = ?,
          pyInitial = ?,
          quanPin = ?,
          sex = ?,
          remark = ?,
          remarkPyInitial = ?,
          remarkQuanPin = ?,
          signature = ?,
          alias = ?,
          snsBgImg = ?,
          country = ?,
          bigHeadImgUrl = ?,
          smallHeadImgUrl = ?,
          description = ?,
          cardImgUrl = ?,
          labelList = ?,
          province = ?,
          city = ?,
          phoneNumList = ?
        WHERE userName = ?
      `;

      await pool.query(sql, [
        newData.nickName || existingContact.nickName,
        newData.pyInitial || existingContact.pyInitial,
        newData.quanPin || existingContact.quanPin,
        newData.sex || existingContact.sex,
        newData.remark || existingContact.remark,
        newData.remarkPyInitial || existingContact.remarkPyInitial,
        newData.remarkQuanPin || existingContact.remarkQuanPin,
        newData.signature || existingContact.signature,
        newData.alias || existingContact.alias,
        newData.snsBgImg || existingContact.snsBgImg,
        newData.country || existingContact.country,
        newData.bigHeadImgUrl || existingContact.bigHeadImgUrl,
        newData.smallHeadImgUrl || existingContact.smallHeadImgUrl,
        newData.description || existingContact.description,
        newData.cardImgUrl || existingContact.cardImgUrl,
        newData.labelList || existingContact.labelList,
        newData.province || existingContact.province,
        newData.city || existingContact.city,
        newData.phoneNumList || existingContact.phoneNumList,
        userName
      ]);

      console.log(`Updated contact: ${userName}`);
    } catch (err) {
      console.error('Error updating contact:', err);
      throw err;
    }
  }

  async findAllContacts() {
    try {
      const pool = await this.connect();
      const [rows] = await pool.query('SELECT * FROM contact');
      return rows;
    } catch (err) {
      console.error('Error finding all contacts:', err);
      throw err;
    }
  }
}

export const db = new myDB();
