import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { router as login } from "./api/login";
import { router as picture } from "./api/picture";
import { router as vote } from "./api/vote";
import { router as rating } from "./api/rating";
export const app = express();
app.use(
    cors({
      origin: "*",
    })
  );
app.use(bodyParser.text());
app.use(bodyParser.json());
app.use("/login", login);
app.use("/picture", picture);
app.use("/vote", vote);
app.use("/rating",rating);
