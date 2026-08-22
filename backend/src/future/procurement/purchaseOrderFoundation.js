'use strict';

const {
  ID_PATTERN,
  findSensitiveField,
} = require('./supplierFoundation');

const ALLOWED_FIELDS = Object.freeze(
  new Set([
    'purchaseOrderId',
    'tenantId',
    'supplierId',
    'procurementRequestId',
    'createdBy',
    'lines',
  ])
);

const ALLOWED_LINE_FIELDS = Object.freeze(
  new Set([
    'materialId',
    'quantity',
    'unitPrice',
  ])
);

function createPurchaseOrderError(
  code,
  message,
  field = null
) {
  const error = new Error(message);
  error.code = code;

  if (field) {
    error.field = field;
  }

  return error;
}

function requireCanonicalId(value, field) {
  if (
    typeof value !== 'string' ||
    !ID_PATTERN.test(value.trim())
  ) {
    throw createPurchaseOrderError(
      'INVALID_PURCHASE_ORDER_IDENTITY',
      `${field} must be a canonical identifier.`,
      field
    );
  }

  return value.trim();
}

function rejectUnknownFields(payload) {
  for (const key of Object.keys(payload)) {
    if (!ALLOWED_FIELDS.has(key)) {
      throw createPurchaseOrderError(
        'UNKNOWN_PURCHASE_ORDER_FIELD',
        'Purchase order contains an unknown field.',
        key
      );
    }
  }
}

function normalizeLines(lines) {
  if (
    !Array.isArray(lines) ||
    lines.length < 1 ||
    lines.length > 100
  ) {
    throw createPurchaseOrderError(
      'INVALID_PURCHASE_ORDER_LINES',
      'lines must contain between 1 and 100 items.',
      'lines'
    );
  }

  const normalized = lines.map((line) => {
    if (
      !line ||
      typeof line !== 'object' ||
      Array.isArray(line)
    ) {
      throw createPurchaseOrderError(
        'INVALID_PURCHASE_ORDER_LINE',
        'Each purchase order line must be an object.',
        'lines'
      );
    }

    for (const key of Object.keys(line)) {
      if (!ALLOWED_LINE_FIELDS.has(key)) {
        throw createPurchaseOrderError(
          'UNKNOWN_PURCHASE_ORDER_LINE_FIELD',
          'Purchase order line contains an unknown field.',
          key
        );
      }
    }

    const materialId = requireCanonicalId(
      line.materialId,
      'materialId'
    );

    if (
      !Number.isSafeInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > 100000
    ) {
      throw createPurchaseOrderError(
        'INVALID_PURCHASE_ORDER_QUANTITY',
        'quantity must be a positive safe integer.',
        'quantity'
      );
    }

    if (
      typeof line.unitPrice !== 'number' ||
      !Number.isFinite(line.unitPrice) ||
      line.unitPrice <= 0 ||
      line.unitPrice > 1000000000
    ) {
      throw createPurchaseOrderError(
        'INVALID_PURCHASE_ORDER_UNIT_PRICE',
        'unitPrice must be a positive finite number.',
        'unitPrice'
      );
    }

    return Object.freeze({
      materialId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    });
  });

  return Object.freeze(normalized);
}

function createPurchaseOrderRecord(payload) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    throw createPurchaseOrderError(
      'INVALID_PURCHASE_ORDER_PAYLOAD',
      'Purchase order payload must be an object.'
    );
  }

  const sensitiveField =
    findSensitiveField(payload);

  if (sensitiveField) {
    throw createPurchaseOrderError(
      'SENSITIVE_PURCHASE_ORDER_FIELD_PROHIBITED',
      'Sensitive supplier identity or banking data is prohibited.',
      sensitiveField
    );
  }

  rejectUnknownFields(payload);

  const record = {
    purchaseOrderId:
      requireCanonicalId(
        payload.purchaseOrderId,
        'purchaseOrderId'
      ),

    tenantId:
      requireCanonicalId(
        payload.tenantId,
        'tenantId'
      ),

    supplierId:
      requireCanonicalId(
        payload.supplierId,
        'supplierId'
      ),

    procurementRequestId:
      requireCanonicalId(
        payload.procurementRequestId,
        'procurementRequestId'
      ),

    createdBy:
      requireCanonicalId(
        payload.createdBy,
        'createdBy'
      ),

    lines:
      normalizeLines(payload.lines),

    status: 'draft',

    governmentApproved: false,
    vendorApproved: false,
    financialAuthority: false,
    approvalAuthoritySource: null,
  };

  return Object.freeze(record);
}

module.exports = {
  ALLOWED_FIELDS,
  ALLOWED_LINE_FIELDS,
  createPurchaseOrderError,
  createPurchaseOrderRecord,
};
