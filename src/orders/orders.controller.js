const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");
const ordersData = require("../data/orders-data");
const e = require("express");

// List all orders
function list(req, res) {
  res.json({ data: orders });
}

// Verify that the Data has a particular property
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

// Verify that `deliverTo` property is valid
function deliverToIsValid(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;
  if (deliverTo.length) {
    return next();
  }
  next({
    status: 400,
    message: `Order must include a deliverTo`,
  });
}

// Verify that `mobileNumber` property is valid
function mobileNumberIsValid(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;
  if (mobileNumber.length) {
    return next();
  }
  next({
    status: 400,
    message: `Order must include a mobileNumber`,
  });
}

// Verify that `dishes` property is valid
function dishesIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  // Check that dishes returns an array with at least one item
  if (Array.isArray(dishes) && dishes.length) {
    // Find index of any dishes that don't have a valid `quantity` property
    const invalidQuantityDish = dishes.findIndex((dish) => {
      return (
        !dish.quantity || !Number.isInteger(dish.quantity) || dish.quantity <= 0
      );
    });
    if (invalidQuantityDish > -1) {
      return next({
        status: 400,
        message: `Dish ${invalidQuantityDish} must have a quantity that is an integer greater than 0`,
      });
    }
    return next();
  }
  next({
    status: 400,
    message: `Order must include at least one dish`,
  });
}

// Verify that `status` property is valid
function statusIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (
    status === "pending" ||
    status === "preparing" ||
    status === "out-for-delivery" ||
    status === "delivered"
  ) {
    return next();
  }
  next({
    status: 400,
    message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
  });
}

// Create new Order
function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

// Verify that order exists
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

// Read a specific order
function read(req, res) {
  res.json({ data: res.locals.order });
}

// Update a specific order
function update(req, res, next) {
  const order = res.locals.order;
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } =
    req.body;
  const { orderId } = req.params;

  // Check that parameter matches order ID of order to be updated
  if (id && id !== orderId) {
    next({
      status: 400,
      message: `Order id does not match route id. Dish: ${id}, Route: ${orderId}`,
    });
  } else if (status === "delivered") {
    // Prevent delivered orders from being updated
    next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  } else {
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;

    res.json({ data: order });
  }
}

// Delete existing order
function destroy(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => (order.id = orderId));
  // Make sure order is pending before delition.
  if (orders[index].status === "pending") {
    const deletedOrders = orders.splice(index, 1);
    res.sendStatus(204);
  } else {
    next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`
    })
  }
}

module.exports = {
  list,
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    deliverToIsValid,
    mobileNumberIsValid,
    dishesIsValid,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("status"),
    bodyDataHas("dishes"),
    deliverToIsValid,
    mobileNumberIsValid,
    dishesIsValid,
    statusIsValid,
    update,
  ],
  delete: [orderExists, destroy],
};
