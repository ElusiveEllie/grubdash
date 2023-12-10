const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// List all dishes
function list(req, res) {
  res.json({ data: dishes });
}

// Verify that the Data has a particular property
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}

// Verify that `name` property is valid
function namePropertyIsValid(req, res, next) {
  const { data: { name } = {} } = req.body;
  if (name.length) {
    return next();
  }
  next({
    status: 400,
    message: `Dish must include a name`,
  });
}

// Verify that `description` property is valid
function descriptionPropertyIsValid(req, res, next) {
  const { data: { description } = {} } = req.body;
  if (description.length) {
    return next();
  }
  next({
    status: 400,
    message: `Dish must include a description`,
  });
}

// Verify that `image_url` property is valid
function imageUrlPropertyIsValid(req, res, next) {
  const { data: { image_url } = {} } = req.body;
  if (image_url.length) {
    return next();
  }
  next({
    status: 400,
    message: `Dish must include a image_url`,
  });
}

// Verify that `price` property is valid
function pricePropertyIsValid(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  }
  next();
}

// Create a new dish
function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// Verify that dish exists
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish id not found: ${dishId}`,
  });
}

// Read specific dish
function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

// Update specific dish
function update(req, res, next) {
  const dish = res.locals.dish;
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  const { dishId } = req.params;

  // Check that parameter matches dish ID of dish to be updated
  if (id && id !== dishId) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  } else {
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;

    res.json({ data: dish });
  }
}

module.exports = {
  list,
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    namePropertyIsValid,
    descriptionPropertyIsValid,
    pricePropertyIsValid,
    imageUrlPropertyIsValid,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    namePropertyIsValid,
    descriptionPropertyIsValid,
    pricePropertyIsValid,
    imageUrlPropertyIsValid,
    update,
  ],
};
