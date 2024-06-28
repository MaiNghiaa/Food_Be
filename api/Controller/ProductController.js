const util = require("util");
const mysql = require("mysql");
const db = require("../Database");
const { request } = require("http");
const { response } = require("express");
const { resolve } = require("path");
const { rejects } = require("assert");

module.exports = {
  // Login ---------
  Login: (request, response) => {
    const { username, password } = request.body;

    // Validate input
    if (!username || !password) {
      return response.status(400).send("Bắt buộc phải nhập nhé  ");
    }

    // Use parameterized query to prevent SQL injection
    const sql = "SELECT * FROM user WHERE username = ? AND password = ?;";
    db.query(sql, [username, password], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return response.status(500).send("Lỗi server ời");
      }

      if (results.length > 0) {
        return response.status(200).send("Login successful");
      } else {
        return response.status(401).send("sai tên đăng nhập hoặc mật khẩu");
      }
    });
  },

  //Register
  register: (request, response) => {
    const {
      username,
      password,
      email,
      role,
      phone,
      address,
      avatar,
      name,
      university,
    } = request.body;

    // Thực hiện truy vấn để thêm dữ liệu vào bảng user
    const query = `INSERT INTO user (username, password, email, role, phone, address, avatar, name, university) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(
      query,
      [
        username,
        password,
        email,
        role,
        phone,
        address,
        avatar,
        name,
        university,
      ],
      (error, result) => {
        if (error) {
          console.error("Error registering user:", error);
          response.status(500).json({ message: "Internal server error" });
        } else {
          console.log("User registered successfully");
          response
            .status(201)
            .json({ message: "User registered successfully" });
        }
      }
    );
  },
};
