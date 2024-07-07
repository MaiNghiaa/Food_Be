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

  // Register endpoint
  register: (req, res) => {
    const { email, password, ten, role } = req.body;

    if (!email || !password || !ten) {
      return res.status(400).send("Email, password, and name are required.");
    }

    // Check if user already exists
    db.query(
      "SELECT * FROM User WHERE email = ?",
      [email],
      (err, existingUser) => {
        if (err) {
          console.error("Error checking existing user:", err);
          return res.status(500).send("Server error.");
        }

        if (existingUser.length > 0) {
          return res.status(400).send("Tài khoản đã được sử dụng.");
        }

        // Hash the password
        bcrypt.hash(password, 10, (err, hashedPassword) => {
          if (err) {
            console.error("Error hashing password:", err);
            return res.status(500).send("Server error.");
          }

          // Insert new user into database
          db.query(
            "INSERT INTO User (email, password, ten,role) VALUES (?, ?, ?, ?)",
            [email, hashedPassword, ten, role],
            (err, results) => {
              if (err) {
                console.error("Error inserting user:", err);
                return res.status(500).send("Server error.");
              }
              res.status(201).send("Registered successfully.");
            }
          );
        });
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

  getOrder: (req, res) => {
    const { name } = req.params;
    // Tìm idnguoidung từ bảng User dựa vào tên người dùng (name)
    db.execute(
      "SELECT idnguoidung FROM User WHERE ten = ?",
      [name],
      (err, userRows) => {
        if (err) {
          console.error("Error finding user:", err);
          return res
            .status(500)
            .json({ error: "Đã xảy ra lỗi khi tìm người dùng" });
        }

        if (userRows.length === 0) {
          return res.status(404).json({ error: "Không tìm thấy người dùng" });
        }

        const idnguoidung = userRows[0].idnguoidung;
        db.execute(
          "SELECT * FROM DonHang WHERE idnguoidung = ?",
          [idnguoidung],
          (err, orders) => {
            if (err) {
              console.error("Error fetching orders:", err);
              return res
                .status(500)
                .json({ error: "Đã xảy ra lỗi khi lấy đơn hàng" });
            }

            const orderIds = orders.map((order) => order.iddonhang);

            if (orderIds.length > 0) {
              db.execute(
                `SELECT * FROM DonHangChiTiet WHERE iddonhang IN (${orderIds.join(
                  ","
                )})`,
                (err, orderDetails) => {
                  if (err) {
                    console.error("Error fetching order details:", err);
                    return res.status(500).json({
                      error: "Đã xảy ra lỗi khi lấy chi tiết đơn hàng",
                    });
                  }

                  orders.forEach((order) => {
                    order.details = orderDetails.filter(
                      (detail) => detail.iddonhang === order.iddonhang
                    );
                  });

                  res.status(200).json(orders);
                }
              );
            } else {
              res.status(200).json([]);
            }
          }
        );
      }
    );
  },

  postOrder: async (req, res) => {
    const {
      cart,
      name,
      solongsanpham,
      tongtien,
      trangthai,
      diachinhan,
      tennguoinhan,
      sdtnguoinhan,
    } = req.body;

    // Tìm idnguoidung từ bảng User dựa vào tên người dùng (name)
    db.execute(
      "SELECT idnguoidung FROM User WHERE ten = ?",
      [name],
      (err, userRows) => {
        if (err) {
          console.error("Error finding user:", err);
          return res
            .status(500)
            .json({ error: "Đã xảy ra lỗi khi tìm người dùng" });
        }

        if (userRows.length === 0) {
          return res.status(404).json({ error: "Không tìm thấy người dùng" });
        }

        const idnguoidung = userRows[0].idnguoidung;

        // Thêm đơn hàng vào bảng DonHang
        db.execute(
          "INSERT INTO DonHang (idnguoidung, solongsanpham, tongtien, trangthai,diachinhan,tennguoinhan,sdtnguoinhan) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            idnguoidung,
            solongsanpham,
            tongtien,
            trangthai,
            diachinhan,
            tennguoinhan,
            sdtnguoinhan,
          ],
          (err, insertDonHang) => {
            if (err) {
              console.error("Error inserting order:", err);
              return res
                .status(500)
                .json({ error: "Đã xảy ra lỗi khi thêm đơn hàng" });
            }

            const iddonhang = insertDonHang.insertId;

            // Thêm chi tiết đơn hàng vào bảng DonHangChiTiet
            const promises = cart.map((item) => {
              return new Promise((resolve, reject) => {
                db.execute(
                  "INSERT INTO DonHangChiTiet (iddonhang, hinhanh, tensanpham, price, Quantity) VALUES (?, ?, ?, ?, ?)",
                  [
                    iddonhang,
                    item.hinhanh,
                    item.tensp,
                    item.giaban,
                    item.quantity,
                  ],
                  (err, result) => {
                    if (err) {
                      console.error("Error inserting order detail:", err);
                      reject(err);
                    } else {
                      resolve(result);
                    }
                  }
                );
              });
            });

            Promise.all(promises)
              .then(() => {
                res
                  .status(200)
                  .json({ message: "Đã thêm đơn hàng thành công" });
              })
              .catch((error) => {
                console.error("Error inserting order details:", error);
                res
                  .status(500)
                  .json({ error: "Đã xảy ra lỗi khi thêm chi tiết đơn hàng" });
              });
          }
        );
      }
    );
  },
  updateOrderbyId: (req, res) => {
    const iddonhang = req.params.iddonhang;
    const { trangthai } = req.body;

    db.execute(
      "UPDATE DonHang SET trangthai = ? WHERE iddonhang = ?",
      [trangthai, iddonhang],
      (err, result) => {
        if (err) {
          console.error("Error updating order:", err);
          return res
            .status(500)
            .json({ error: "Đã xảy ra lỗi khi cập nhật đơn hàng" });
        }

        if (trangthai === "Đang giao") {
          db.execute(
            "SELECT * FROM DonHangChiTiet WHERE iddonhang = ?",
            [iddonhang],
            (err, orderDetails) => {
              if (err) {
                console.error("Error fetching order details:", err);
                return res.status(500).json({
                  error: "Đã xảy ra lỗi khi lấy chi tiết đơn hàng",
                });
              }

              // Cập nhật số lượng sản phẩm trong bảng SanPham
              const promises = orderDetails.map((detail) => {
                return new Promise((resolve, reject) => {
                  db.execute(
                    "UPDATE SanPham SET soluong = soluong - ? WHERE tensp = ?",
                    [detail.Quantity, detail.tensanpham],
                    (err, result) => {
                      if (err) {
                        console.error(
                          `Error updating quantity for product ${detail.idsp}:`,
                          err
                        );
                        reject(err);
                      } else {
                        resolve(result);
                      }
                    }
                  );
                });
              });

              Promise.all(promises)
                .then(() => {
                  res
                    .status(200)
                    .json({ message: "Cập nhật đơn hàng thành công" });
                })
                .catch((error) => {
                  console.error("Error updating product quantities:", error);
                  res.status(500).json({
                    error: "Đã xảy ra lỗi khi cập nhật số lượng sản phẩm",
                  });
                });
            }
          );
        } else {
          res.status(200).json({ message: "Cập nhật đơn hàng thành công" });
        }
      }
    );
  },
  deleteProduct: async (req, res) => {
    try {
      const { idsp } = req.params;

      const query = "DELETE FROM SanPham WHERE idsp = ?";
      await db.query(query, [idsp]);

      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Error deleting product" });
    }
  },
};
