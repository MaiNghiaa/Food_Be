// router.js

"use strict";
const multer = require("multer");
const express = require("express");
const path = require("path");
const ProductsController = require("./Controller/ProductController");

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
};
