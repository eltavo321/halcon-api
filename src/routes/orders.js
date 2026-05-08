const express =
  require("express");

const router =
  express.Router();

const {
  getOrders,
  updateOrder
} = require(
  "../controllers/ordersController"
);

router.get(
  "/",
  getOrders
);

router.put(
  "/:id",
  updateOrder
);

module.exports =
  router;