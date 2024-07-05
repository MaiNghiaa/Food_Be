// router.js

"use strict";
const multer = require("multer");
const express = require("express");
const path = require("path");
const ProductsController = require("./Controller/ProductController");
const AdminController = require("./Controller/AdminController");

module.exports = function (app) {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "assets/"); // Thư mục lưu trữ tệp
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)); // Đặt tên tệp
    },
  });

  const upload = multer({ storage: storage });
  // Sử dụng middleware để phục vụ file tĩnh từ thư mục 'assets'
  app.use("/assets", express.static("assets"));

  //cac route

  //Dang nhập
  app.route("/login").post(ProductsController.Login);
  //Dang ki
  app.route("/register").post(ProductsController.register);

  app.route("/getType").get(ProductsController.getType);
  //San pham

  app.route("/getProduct").get(ProductsController.getProduct);
  //hien thi san pham
  app.route("/getProductinadmin").get(AdminController.getProducts);
  //them san pham
  app
    .route("/Product")
    .post(upload.single("hinhanh"), AdminController.createProduct);
  //sua san pham
  app
    .route("/Product/:idsp")
    .put(upload.single("hinhanh"), AdminController.updateProduct);
  //xoa san pham
  app.route("/Product/:idsp").delete(AdminController.deleteProduct);

  //Tintuc
  //Hien thị tin tức
  app.route("/Tintuc").get(ProductsController.getTintuc);

  //Them
  app
    .route("/Tintuc")
    .post(upload.single("hinhanh"), AdminController.postTinTuc);
  //Sua
  app
    .route("/Tintuc/:id")
    .put(upload.single("hinhanh"), AdminController.updateTinTuc);
  //xoa
  app.route("/Tintuc/:id").delete(AdminController.deleteTinTuc);
  //Het phan tin tuc

  app.route("/getDetailProduct").get(ProductsController.getDetailProduct);
  app.route("/getProfile").get(ProductsController.getProfile);
  app.route("/updateProfile").post(ProductsController.updateProfile);
  app.route("/updatepassword").post(ProductsController.updatepassword);
  app.route("/order").post(ProductsController.postOrder);

  app.route("/order/:iddonhang").put(ProductsController.updateOrderbyId);
  app.route("/order/:name").get(ProductsController.getOrder);
  app.route("/loginAdmin").post(AdminController.LoginAdmin);

  // app
  //   .route("/Product")
  //   .post(upload.single("image"), ProductsController.postProduct);
  // app.route("/");
};
