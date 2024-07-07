const util = require("util");
const mysql = require("mysql");

const db = require("../Database");
const { request } = require("http");
const { response } = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { resolve } = require("path");
const { rejects } = require("assert");
const fs = require("fs");

module.exports = {
  LoginAdmin: (req, res) => {
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
        if (user.role === "Customer") {
          return res.status(400).send("Tài khoản không có quyền đăng nhập.");
        }

        const Name = user.ten;
        const role = user.role;

        const token = jwt.sign(
          { idnguoidung: user.idnguoidung },
          "your_jwt_secret",
          { expiresIn: "1h" }
        );
        res.status(200).json({ token, Name, role });
      }
    );
  },

  postTinTuc: (req, res) => {
    const { name, day, hour } = req.body;
    const hinhanh = req.file ? req.file.filename : null;
    console.log(hinhanh);

    db.query(
      "INSERT INTO TinTuc (name, hinhanh, day, hour) VALUES (?, ?, ?, ?)",
      [name, hinhanh, day, hour],
      (err, result) => {
        if (err) {
          console.error("Error adding news:", err);
          return res
            .status(500)
            .json({ error: "Đã xảy ra lỗi khi thêm tin tức mới" });
        }
        res.json({ message: "Thêm tin tức thành công" });
      }
    );
  },
  updateTinTuc: (req, res) => {
    const idTintuc = req.params.id;
    const { name, day, hour } = req.body;
    const hinhanh = req.file ? req.file.filename : null;

    db.query(
      "UPDATE TinTuc SET name = ?, hinhanh = ?, day = ?, hour = ? WHERE idTintuc = ?",
      [name, hinhanh, day, hour, idTintuc],
      (err, result) => {
        if (err) {
          console.error("Error updating news:", err);
          return res
            .status(500)
            .json({ error: "Đã xảy ra lỗi khi cập nhật tin tức" });
        }
        res.json({ message: "Cập nhật tin tức thành công" });
      }
    );
  },
  deleteTinTuc: (req, res) => {
    const idTintuc = req.params.id;

    db.query(
      "SELECT hinhanh FROM TinTuc WHERE idTintuc = ?",
      idTintuc,
      (err, results) => {
        if (err) {
          console.error("Error fetching news:", err);
          return res
            .status(500)
            .json({ error: "Đã xảy ra lỗi khi lấy tin tức" });
        }

        // // const hinhanhPath = `./assets/${results[0].hinhanh}`;

        // // fs.unlink(hinhanhPath, (err) => {
        // //   if (err) {
        // //     console.error("Error deleting image:", err);
        // //     return res
        // //       .status(500)
        // //       .json({ error: "Đã xảy ra lỗi khi xóa hình ảnh" });
        //   }

        db.query(
          "DELETE FROM TinTuc WHERE idTintuc = ?",
          idTintuc,
          (err, result) => {
            if (err) {
              console.error("Error deleting news:", err);
              return res
                .status(500)
                .json({ error: "Đã xảy ra lỗi khi xóa tin tức" });
            }
            res.json({ message: "Xóa tin tức thành công" });
          }
        );
      }
    );
  },
  //hienthi sanpham
  getProducts: (req, res) => {
    // SQL query to fetch all products with details from SanPham and SanPhamChiTiet tables
    const query = `
    SELECT sp.idsp, sp.tensp, sp.hinhanh, sp.soluong, sp.giaban, sp.idType,
       tp.type_name, sct.motasanpham, sct.thuonghieu
FROM SanPham sp
LEFT JOIN SanPhamChiTiet sct ON sp.idsp = sct.idsp
LEFT JOIN type tp ON sp.idType = tp.idType;

    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching products:", err);
        return res.status(500).json({ error: "Error fetching products" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "No products found" });
      }

      res.status(200).json({ products: results });
    });
  },
  //sanpham
  createProduct: (req, res) => {
    const { tensp, soluong, idType, giaban, motasanpham, thuonghieu } =
      req.body;
    const hinhanh = req.file ? req.file.filename : null;

    // Insert into SanPham table
    const insertProductQuery = `
      INSERT INTO SanPham (tensp, hinhanh, soluong, idType, giaban)
      VALUES (?, ?, ?, ?, ?)`;
    const productValues = [tensp, hinhanh, soluong, idType, giaban];
    db.query(insertProductQuery, productValues, (err, productInsertResult) => {
      if (err) {
        console.error("Lỗi khi thêm sản phẩm:", err);
        return res.status(500).json({ error: "Lỗi khi thêm sản phẩm" });
      }

      // Get the last inserted ID
      const lastInsertId = productInsertResult.insertId;

      // Insert into SanPhamChiTiet table
      const insertProductDetailQuery = `
        INSERT INTO SanPhamChiTiet (idsp, motasanpham, thuonghieu)
        VALUES (?, ?, ?)`;
      const productDetailValues = [lastInsertId, motasanpham, thuonghieu];
      db.query(insertProductDetailQuery, productDetailValues, (err) => {
        if (err) {
          console.error("Lỗi khi thêm chi tiết sản phẩm:", err);
          return res
            .status(500)
            .json({ error: "Lỗi khi thêm chi tiết sản phẩm" });
        }

        res.status(200).json({ message: "Thêm sản phẩm thành công" });
      });
    });
  },
  updateProduct: (req, res) => {
    const { idsp } = req.params;
    const { tensp, soluong, idType, giaban, motasanpham, thuonghieu } =
      req.body;

    let query1 =
      "UPDATE SanPham SET tensp = ?, soluong = ?, idType = ?, giaban = ?";
    const params1 = [tensp, soluong, idType, giaban];

    if (req.file) {
      const hinhanh = req.file.filename;
      query1 += ", hinhanh = ?";
      params1.push(hinhanh);
    }

    query1 += " WHERE idsp = ?";
    params1.push(idsp);

    db.query(query1, params1)
      .then(() => {
        const query2 =
          "UPDATE SanPhamChiTiet SET motasanpham = ?, thuonghieu = ? WHERE idsp = ?";
        return db.query(query2, [motasanpham, thuonghieu, idsp]);
      })
      .then(() => {
        res.status(200).json({ message: "Product updated successfully" });
      })
      .catch((error) => {
        console.error("Error updating product:", error);
        res.status(500).json({ error: "Error updating product" });
      });
  },
  deleteProduct: (req, res) => {
    const { idsp } = req.params;

    // Delete from SanPhamChiTiet table
    const query1 = "DELETE FROM SanPhamChiTiet WHERE idsp = ?";
    db.query(query1, [idsp], (err1) => {
      if (err1) {
        console.error("Lỗi khi xóa chi tiết sản phẩm:", err1);
        return res
          .status(500)
          .json({ error: "Đã xảy ra lỗi khi xóa sản phẩm" });
      }

      // Delete from SanPham table
      const query2 = "DELETE FROM SanPham WHERE idsp = ?";
      db.query(query2, [idsp], (err2) => {
        if (err2) {
          console.error("Lỗi khi xóa sản phẩm:", err2);
          return res
            .status(500)
            .json({ error: "Đã xảy ra lỗi khi xóa sản phẩm" });
        }

        res.status(200).json({ message: "Xóa sản phẩm thành công" });
      });
    });
  },

  createType: (req, res) => {
    const { type_name } = req.body;
    if (!type_name) {
      res.status(400).json({ error: "type_name is required" });
      return;
    }
    db.query("INSERT INTO `type` SET ?", { type_name }, (err, result) => {
      if (err) {
        console.error("Error creating type:", err);
        res.status(500).json({ error: "Error creating type" });
        return;
      }
      res
        .status(201)
        .json({ message: "Type created successfully", id: result.insertId });
    });
  },
  updateType: (req, res) => {
    const { id } = req.params;
    const { type_name } = req.body;
    if (!type_name) {
      res.status(400).json({ error: "type_name is required" });
      return;
    }
    db.query(
      "UPDATE `type` SET `type_name` = ? WHERE `idType` = ?",
      [type_name, id],
      (err, result) => {
        if (err) {
          console.error("Error updating type:", err);
          res.status(500).json({ error: "Error updating type" });
          return;
        }
        res.json({ message: "Type updated successfully" });
      }
    );
  },
  deleteType: (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM `type` WHERE `idType` = ?", id, (err, result) => {
      if (err) {
        console.error("Error deleting type:", err);
        res.status(500).json({ error: "Error deleting type" });
        return;
      }
      res.json({ message: "Type deleted successfully" });
    });
  },

  getOrderAdmin: (req, res) => {
    const sql = `
      SELECT dh.iddonhang, dh.idnguoidung, dh.solongsanpham, dh.trangthai, dh.tongtien,
             dh.diachinhan, dh.tennguoinhan, dh.sdtnguoinhan, dh.created_at, dh.updated_at,
             dhct.iddonhangchitiet, dhct.tensanpham, dhct.price, dhct.Quantity, dhct.hinhanh,
             dhct.created_at AS detail_created_at, dhct.updated_at AS detail_updated_at
      FROM DonHang dh
      LEFT JOIN DonHangChiTiet dhct ON dh.iddonhang = dhct.iddonhang
    `;

    db.query(sql, (error, results) => {
      if (error) {
        console.error("Error fetching orders with details:", error);
        res.status(500).json({ error: "Error fetching orders with details" });
        return;
      }

      // Biến kết quả thành một mảng chi tiết
      const ordersWithDetails = results.reduce((acc, row) => {
        // Tìm đơn hàng trong mảng đã có hay chưa
        let order = acc.find((o) => o.iddonhang === row.iddonhang);

        // Nếu chưa có, thêm mới đơn hàng vào mảng
        if (!order) {
          order = {
            iddonhang: row.iddonhang,
            idnguoidung: row.idnguoidung,
            solongsanpham: row.solongsanpham,
            trangthai: row.trangthai,
            tongtien: row.tongtien,
            diachinhan: row.diachinhan,
            tennguoinhan: row.tennguoinhan,
            sdtnguoinhan: row.sdtnguoinhan,
            created_at: row.created_at,
            updated_at: row.updated_at,
            details: [],
          };
          acc.push(order);
        }

        // Thêm chi tiết đơn hàng vào mảng chi tiết của đơn hàng
        if (row.iddonhangchitiet) {
          order.details.push({
            iddonhangchitiet: row.iddonhangchitiet,
            tensanpham: row.tensanpham,
            price: row.price,
            Quantity: row.Quantity,
            hinhanh: row.hinhanh,
            created_at: row.detail_created_at,
            updated_at: row.detail_updated_at,
          });
        }

        return acc;
      }, []);

      // Trả về kết quả là một mảng đơn hàng kèm chi tiết
      console.log(ordersWithDetails);
      res.json(ordersWithDetails);
    });
  },

  getUsers: (req, res) => {
    const query = `SELECT * FROM User`;
    db.query(query, (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  },
  postUsers: (req, res) => {
    const { email, password, ten, tuoi, gioitinh, ngaysinh, sdt, role } =
      req.body;

    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res.status(500).json({ error: "Error hashing password" });
      }

      const query = `INSERT INTO User (email, password, ten, tuoi, gioitinh, ngaysinh, sdt, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      db.query(
        query,
        [email, hash, ten, tuoi, gioitinh, ngaysinh, sdt, role],
        (err, result) => {
          if (err) {
            return res
              .status(500)
              .json({ error: "Error inserting user into database" });
          }
          res.json({ id: result.insertId, ...req.body, password: undefined });
        }
      );
    });
  },
  updateUsers: (req, res) => {
    const { id } = req.params;
    const { email, password, ten, tuoi, gioitinh, ngaysinh, sdt, role } =
      req.body;
    const query = `UPDATE User SET email = ?, password = ?, ten = ?, tuoi = ?, gioitinh = ?, ngaysinh = ?, sdt = ?, role = ? WHERE idnguoidung = ?`;
    db.query(
      query,
      [email, password, ten, tuoi, gioitinh, ngaysinh, sdt, role, id],
      (err) => {
        if (err) throw err;
        res.sendStatus(200);
      }
    );
  },
  deleteUsers: (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM User WHERE idnguoidung = ?`;
    db.query(query, [id], (err) => {
      if (err) throw err;
      res.sendStatus(200);
    });
  },
};
