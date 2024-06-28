const util = require("util");
const mysql = require("mysql");
const db = require("../Database");
const { request } = require("http");
const { response } = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { resolve } = require("path");
const { rejects } = require("assert");

module.exports = {
  // Login ---------
  Login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send("Email và mật khẩu là bắt buộc.");
    }

    db.query(
      "SELECT * FROM User WHERE email = ?",
      [email],
      async (err, results) => {
        if (err) return res.status(500).send("Lỗi server.");
        if (results.length === 0) {
          return res.status(400).send("Không tìm thấy người dùng.");
        }

        const user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(400).send("Mật khẩu không hợp lệ.");
        }

        const token = jwt.sign(
          { idnguoidung: user.idnguoidung },
          "your_jwt_secret",
          { expiresIn: "1h" }
        );
        res.status(200).json({ token });
      }
    );
  },

  //Register
  register: (req, res) => {
    const { email, password, ten } = req.body;

    if (!email || !password || !ten) {
      return res.status(400).send("Email, mật khẩu và tên là bắt buộc.");
    }

    db.query(
      "SELECT * FROM User WHERE email = ?",
      [email],
      async (err, results) => {
        if (err) return res.status(500).send("Lỗi server.");
        if (results.length > 0) {
          return res.status(400).send("Người dùng đã tồn tại.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
          email,
          password: hashedPassword,
          ten,
        };

        db.query(
          "INSERT INTO User (email, password, ten) VALUES (?, ?, ?)",
          [newUser.email, newUser.password, newUser.ten],
          (err, results) => {
            if (err) return res.status(500).send("Lỗi server.");
            res.status(201).send("Đăng ký thành công.");
          }
        );
      }
    );
  },

  getProduct: (req, res) => {},
  getType: (req, res) => {},
};
