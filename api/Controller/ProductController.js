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

        const Name = user.ten;
        const token = jwt.sign(
          { idnguoidung: user.idnguoidung },
          "your_jwt_secret",
          { expiresIn: "1h" }
        );
        res.status(200).json({ token, Name });
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

  getProduct: (req, res) => {
    const query =
      "SELECT SanPham.*, Type.type_name FROM   SanPham INNER JOIN   Type ON  SanPham.idType = Type.idType";

    db.query(query, (err, results) => {
      if (err) {
        console.error("Lỗi truy vấn:", err);
        res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu" });
      } else {
        res.json(results);
      }
    });
  },

  getDetailProduct: (req, res) => {
    const { idsp } = req.query;
    const query = `SELECT * FROM SanPhamChiTiet Where idsp = ${idsp}`;
    db.query(query, (err, results) => {
      if (err) {
        console.error("Lỗi truy vấn:", err);
        res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu" });
      } else {
        res.json(results);
      }
    });
  },
  getTintuc: (req, res) => {
    const query = "SELECT * FROM TinTuc";

    db.query(query, (err, results) => {
      if (err) {
        console.error("Lỗi truy vấn:", err);
        res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu" });
      } else {
        res.json(results);
      }
    });
  },
  getType: (req, res) => {
    const query = "SELECT * FROM Type";

    db.query(query, (err, results) => {
      if (err) {
        console.error("Lỗi truy vấn:", err);
        res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu" });
      } else {
        res.json(results);
      }
    });
  },

  getProfile: (req, res) => {
    const { Name } = req.query;
    const query = `SELECT * FROM FoodStore.User WHERE ten = ${Name}`;
    db.query(query, (err, results) => {
      if (err) {
        console.error("Lỗi truy vấn:", err);
        res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu" });
      } else {
        res.json(results);
      }
    });
  },

  updateProfile: (req, res) => {
    const { formData, Name } = req.body;
    const { tuoi, gioitinh, ngaysinh, sdt } = formData;
    // console.log(Name, formData);
    const query = `
      UPDATE User 
      SET tuoi = ?, gioitinh = ?, ngaysinh = ?, sdt = ? 
      WHERE ten = ?
    `;

    db.query(query, [tuoi, gioitinh, ngaysinh, sdt, Name], (err, result) => {
      if (err) {
        console.error(err);
        res
          .status(500)
          .send({ message: "Cập nhật không thành công", error: err });
      } else {
        res.status(200).send({ message: "Cập nhật thành công", result });
      }
    });
  },
  updatepassword: (req, res) => {
    const { newPassword, Name } = req.body;

    // Hash mật khẩu mới
    bcrypt.hash(newPassword, 10, (hashErr, hashednewPassword) => {
      if (hashErr) {
        console.error("Hash mật khẩu mới thất bại:", hashErr);
        return res
          .status(500)
          .send({ message: "Cập nhật không thành công", error: hashErr });
      }

      const query = `
      UPDATE User 
      SET password = ?
      WHERE ten = ?
    `;

      db.query(query, [hashednewPassword, Name], (queryErr, result) => {
        if (queryErr) {
          console.error("Lỗi truy vấn cập nhật:", queryErr);
          return res
            .status(500)
            .send({ message: "Cập nhật không thành công", error: queryErr });
        }

        res.status(200).send({ message: "Cập nhật thành công", result });
      });
    });
  },
};
