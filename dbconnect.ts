import mysql from 'mysql';
import util from 'util';
export const conn = mysql.createPool(
    {
        connectionLimit: 10,
        host: "202.28.34.197",
        user: "web66_65011212186",
        password: "65011212186@csmsu",
        database: "web66_65011212186",
    }
);
export { mysql };
export const queryAsync = util.promisify(conn.query).bind(conn);
