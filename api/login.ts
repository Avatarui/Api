import express, { Express } from "express";
import { conn , mysql} from "../dbconnect";
import { signup } from "../model/sign-up";

export const router = express.Router();
router.get("/:username/:password", (req ,res)=>{
    let username = req.params.username;
    let password = req.params.password;
    const sql = "SELECT * FROM user WHERE username = ? AND password = ?";
    conn.query(sql,[username,password],(err,result,fields)=>{
        if (result && result.length > 0 ){
            res.json(result);
        } else {
            res.json({
                success : false,
            });
        }
    })
});
router.post("/signup",(req,res)=>{
    let signup : signup = req.body;
    let sql = "INSERT INTO user(name, username, password, type) VALUES (?, ?, ?, ?)";
    sql = mysql.format(sql, [
        signup.name,
        signup.username,
        signup.password,
        // signup.avatar,
        "user"  // Set the 'type' value to "user"
    ]);
    conn.query(sql,(err,result)=>{
        if(err)throw err;
        res.status(201).json({affected_row : result.affectedRows });
    });
});