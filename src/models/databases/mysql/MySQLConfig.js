export default {
    host: process.env.mysql_hostname || 'localhost',
    user: process.env.mysql_username || 'root',
    password:
        process.env.mysql_password ||
        '{"encrypted":"f9b7f2c51d9629a933c3b6a5","tag":{"type":"Buffer","data":[30,192,255,200,106,122,190,182,176,136,2,6,167,122,152,61]},"iv":{"type":"Buffer","data":[101,2,130,98,15,176,120,20,155,36,79,243,234,169,112,98,55,131,137,134,111,1,210,196,129,240,103,164,108,230,9,22]}}',
    database: process.env.mysql_database || 'sampledb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}
