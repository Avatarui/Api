import express from "express";
import { conn, mysql, queryAsync } from "../dbconnect";
// import { UpDateImg } from "../model/updateimg";
export const router = express.Router();
//rating all
router.get("/", (req, res) => {
  conn.query(
    "SELECT * FROM `picture` ORDER BY `point` DESC LIMIT 10",
    (err, result, fields) => {
      if (result && result.length > 0) {
        res.json(result);
      } else {
        res.json({
          success: false,
        });
      }
    }
  );
});

router.get("/yesterday", (req, res) => {
  conn.query(
    `
          SELECT  
              picture.*,
              RANK() OVER (ORDER BY SUM(vote.point) DESC)
          FROM 
                picture,vote
          WHERE  
            picture.picture_id = vote.picture_id
          AND
              DATE(vote.date) = CURDATE() - INTERVAL 1 DAY
          GROUP BY 
            picture.picture_id, picture.url, picture.description, picture.point, picture.uid 
          ORDER BY 
            picture.point DESC
          LIMIT 0, 10 `,
    (err, result, fields) => {
      if (result && result.length > 0) {
        res.json(result);
      } else {
        res.json({
          success: false,
        });
      }
    }
  );
});

router.get("/today", (req, res) => {
  conn.query(
    `
          SELECT  
              picture.*,
              RANK() OVER (ORDER BY SUM(vote.point) DESC)
          FROM 
            picture,vote
          WHERE  
              picture.picture_id = vote.picture_id
          GROUP BY 
            picture.picture_id, picture.url, picture.description, picture.point, picture.uid
          ORDER BY 
            picture.point DESC
          LIMIT 0, 10 `,
    (err, result, fields) => {
      if (result && result.length > 0) {
        // ส่ง response กลับด้วยข้อมูลผู้ใช้
        res.json(result);
      } else {
        // ถ้าไม่พบผู้ใช้, ส่ง response กลับเป็น { success: false }
        res.json({
          success: false,
        });
      }
    }
  );
});

// router.get("/graph/:uid", (req, res) => {
//   let uid = +req.params.uid;
//   const sql = `
//   SELECT
//   GROUP_CONCAT(voteDate ORDER BY voteDate ASC) AS voteDate,
//   GROUP_CONCAT(totalScore ORDER BY voteDate ASC) AS totalScore,
//   picture_id,
//   description,
//   url
//   FROM (
//       SELECT
//       DATE(date) AS voteDate,
//       500 + SUM(vote.point) AS totalScore,
//       vote.picture_id,
//       picture.description,
//       picture.url
//       FROM vote,picture
//       WHERE vote.picture_id = picture.picture_id
//          AND DATE(date) >= CURDATE() - INTERVAL 7 DAY
//       AND DATE(date) < CURDATE()
//       AND vote.uid = ?
//       GROUP BY DATE(date), picture_id
//       ) AS subquery
//       GROUP BY picture_id
//       ORDER BY picture_id, MAX(voteDate) ASC
//     `;
//   conn.query(sql, [uid], (err, result, fields) => {
//     if (result && result.length > 0) {
//       // ส่ง response กลับด้วยข้อมูลผู้ใช้
//       res.json(result);
//     } else {
//       // ถ้าไม่พบผู้ใช้, ส่ง response กลับเป็น { success: false }
//       res.json({
//         success: false,
//       });
//     }
//   });
// });
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

router.get("/graph/:uid", async (req, res) => {
  const uid = +req.params.uid;
  let day7: any = {};
  // เริ่มที่วันที่ 6 ถึง 0 (แทน 7 วันย้อนหลัง)
  for (let i = 6; i >= 0; i--) {
    let sql: string;
    if (i === 0) {
      sql = mysql.format(
        `SELECT 
            picture.picture_id,
            picture.description,
            DATE(CURDATE()) AS voteDate,
            500+SUM(vote.point) as score,
            picture.url
          FROM vote, picture
          WHERE vote.picture_id = picture.picture_id
          AND vote.uid = ?
          GROUP BY picture_id, DATE(CURDATE()), picture.url, picture.description`,
        [uid]
      );
    } else {
      sql = mysql.format(
        `SELECT picture.picture_id, 
          picture.description, 
          DATE(DATE_SUB(NOW(), INTERVAL ? DAY)) AS voteDate, 
          500+SUM(CASE WHEN DATE(date) <= CURDATE() - INTERVAL ? DAY THEN vote.point ELSE 0 END) AS score, 
          picture.url 
        FROM vote, picture 
        WHERE vote.picture_id = picture.picture_id AND vote.uid = ? 
        GROUP BY picture_id, DATE(DATE_SUB(NOW(), INTERVAL ? DAY)), picture.url, picture.description`,
        [i, i, uid, i]
      );
    }

    let results: any[] = (await queryAsync(sql)) as unknown[];
    // ตรวจสอบผลลัพธ์ที่ได้จากการสอบถามฐานข้อมูล
    for (let result of results) {
      // ตรวจสอบว่าออบเจกต์ที่มี key เป็นวันที่หรือยัง
      if (day7[result.picture_id]) {
        // ถ้ามีอยู่แล้ว เพิ่มค่าเสียงเข้าไปในออบเจกต์ที่มีอยู่แล้ว
        day7[result.picture_id].date +=
          "," + formatDate(new Date(result.voteDate));
        day7[result.picture_id].point += "," + result.score;
      } else {
        // ถ้ายังไม่มีให้สร้าง key ใหม่และใส่ค่าเสียงเข้าไป
        day7[result.picture_id] = {
          picture_id: result.picture_id,
          description: result.description,
          date: formatDate(new Date(result.voteDate)),
          point: result.score.toString(),
          url: result.url,
        };
      }
    }
  }

  // แปลง object ให้กลายเป็น array ของค่าเสียง
  let day7Array = Object.values(day7);

  res.json(day7Array);
});
