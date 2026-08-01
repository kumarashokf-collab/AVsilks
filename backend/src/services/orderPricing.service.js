'use strict';

const {
  ORDER_LIMITS,
  SHIPPING_POLICY,
  ORDER_CURRENCY,
} = require('../constants/orderPolicy');

function toPaise(amount, fieldName) {
  const numericAmount = Number(amount);

  if (
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0
  ) {
    throw new Error(
      `${fieldName} must be a positive number.`
    );
  }

  const paise = Math.round(numericAmount * 100);

  if (!Number.isSafeInteger(paise)) {
    throw new Error(
      `${fieldName} exceeds the supported amount.`
    );
  }

  return paise;
}

function fromPaise(paise) {
  return Number((paise / 100).toFixed(2));
}

function calculateOrderTotals(items) {
  if (
    !Array.isArray(items) ||
    items.length < 1 ||
    items.length > ORDER_LIMITS.MAX_ORDER_LINES
  ) {
    throw new Error(
      `Order must contain between 1 and ${ORDER_LIMITS.MAX_ORDER_LINES} items.`
    );
  }

  let subtotalPaise = 0;

  items.forEach((item, index) => {
    const quantity = Number(item?.quantity);

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > ORDER_LIMITS.MAX_ITEM_QUANTITY
    ) {
      throw new Error(
        `items[${index}].quantity is invalid.`
      );
    }

    const pricePaise = toPaise(
      item?.price,
      `items[${index}].price`
    );

    const lineTotalPaise =
      pricePaise * quantity;

    if (!Number.isSafeInteger(lineTotalPaise)) {
      throw new Error(
        `items[${index}] total exceeds the supported amount.`
      );
    }

    subtotalPaise += lineTotalPaise;

    if (!Number.isSafeInteger(subtotalPaise)) {
      throw new Error(
        'Order subtotal exceeds the supported amount.'
      );
    }
  });

  const freeShippingThresholdPaise =
    Math.round(
      SHIPPING_POLICY.FREE_SHIPPING_THRESHOLD * 100
    );

  const shippingChargePaise =
    subtotalPaise >= freeShippingThresholdPaise
      ? 0
      : Math.round(
          SHIPPING_POLICY
            .STANDARD_SHIPPING_CHARGE * 100
        );

  const totalPaise =
    subtotalPaise + shippingChargePaise;

  if (!Number.isSafeInteger(totalPaise)) {
    throw new Error(
      'Order total exceeds the supported amount.'
    );
  }

  return Object.freeze({
    subtotal: fromPaise(subtotalPaise),
    shippingCharge: fromPaise(
      shippingChargePaise
    ),
    total: fromPaise(totalPaise),
    currency: ORDER_CURRENCY,
  });
}

module.exports = {
  calculateOrderTotals,
  toPaise,
  fromPaise,
};
