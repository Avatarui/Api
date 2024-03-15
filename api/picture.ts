import express from "express";
import {conn, mysql, queryAsync} from "../dbconnect";
import { UpDateImg } from "../model/updateimg";
export const router = express.Router();

router.get("/", (req, res) => {
    conn.query('select * from picture', (err, result, fields)=>{
        if (result && result.length > 0) {
            // ส่ง response กลับด้วยข้อมูลผู้ใช้
            res.json(result);
        } else {
            // ถ้าไม่พบผู้ใช้, ส่ง response กลับเป็น { success: false }
            res.json({
                success: false,
            });
        }
    });
  });

  router.put("/update/:imgid", async(req,res)=>{
    const imgid = +req.params.imgid;
    let img : UpDateImg = req.body;
        let sql = "update  picture set `point`=? where `picture_id`=?";
        sql = mysql.format(sql , [
            img.point,
            imgid
        ]);
        //5.Send Query for updata
        conn.query(sql,(err,result)=>{
            if(err)throw err;
            res.status(200).json({
                affected_row : result.affectedRows
            });
        });
});