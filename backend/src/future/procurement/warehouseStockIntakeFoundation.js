'use strict';

const {
  ID_PATTERN,
  findSensitiveField,
} = require('./supplierFoundation');

const ALLOWED_FIELDS = Object.freeze(
  new Set([
    'stockIntakeId',
    'tenantId',
    'warehouseId',
    'purchaseOrderId',
    'receivedBy',
    'lines',
  ])
);

const ALLOWED_LINE_FIELDS = Object.freeze(
  new Set([
    'materialId',
    'receivedQuantity',
  ])
);

function createWarehouseStockIntakeError(
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
    throw createWarehouseStockIntakeError(
      'INVALID_WAREHOUSE_STOCK_INTAKE_IDENTITY',
      `${field} must be a canonical identifier.`,
      field
    );
  }

  return value.trim();
}

function rejectUnknownFields(payload) {
  for (const key of Object.keys(payload)) {
    if (!ALLOWED_FIELDS.has(key)) {
      throw createWarehouseStockIntakeError(
        'UNKNOWN_WAREHOUSE_STOCK_INTAKE_FIELD',
        'Warehouse stock intake contains an unknown field.',
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
    throw createWarehouseStockIntakeError(
      'INVALID_WAREHOUSE_STOCK_INTAKE_LINES',
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
      throw createWarehouseStockIntakeError(
        'INVALID_WAREHOUSE_STOCK_INTAKE_LINE',
        'Each stock intake line must be an object.',
        'lines'
      );
    }

    for (const key of Object.keys(line)) {
      if (!ALLOWED_LINE_FIELDS.has(key)) {
        throw createWarehouseStockIntakeError(
          'UNKNOWN_WAREHOUSE_STOCK_INTAKE_LINE_FIELD',
          'Stock intake line contains an unknown field.',
          key
        );
      }
    }

    const materialId =
      requireCanonicalId(
        line.materialId,
        'materialId'
      );

    if (
      !Number.isSafeInteger(
        line.receivedQuantity
      ) ||
      line.receivedQuantity < 1 ||
      line.receivedQuantity > 100000
    ) {
      throw createWarehouseStockIntakeError(
        'INVALID_WAREHOUSE_STOCK_INTAKE_QUANTITY',
        'receivedQuantity must be a positive safe integer.',
        'receivedQuantity'
      );
    }

    return Object.freeze({
      materialId,
      receivedQuantity:
        line.receivedQuantity,
    });
  });

  return Object.freeze(normalized);
}

function createWarehouseStockIntakeRecord(payload) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    throw createWarehouseStockIntakeError(
      'INVALID_WAREHOUSE_STOCK_INTAKE_PAYLOAD',
      'Warehouse stock intake payload must be an object.'
    );
  }

  const sensitiveField =
    findSensitiveField(payload);

  if (sensitiveField) {
    throw createWarehouseStockIntakeError(
      'SENSITIVE_WAREHOUSE_STOCK_INTAKE_FIELD_PROHIBITED',
      'Sensitive supplier identity or banking data is prohibited.',
      sensitiveField
    );
  }

  rejectUnknownFields(payload);

  const record = {
    stockIntakeId:
      requireCanonicalId(
        payload.stockIntakeId,
        'stockIntakeId'
      ),

    tenantId:
      requireCanonicalId(
        payload.tenantId,
        'tenantId'
      ),

    warehouseId:
      requireCanonicalId(
        payload.warehouseId,
        'warehouseId'
      ),

    purchaseOrderId:
      requireCanonicalId(
        payload.purchaseOrderId,
        'purchaseOrderId'
      ),

    receivedBy:
      requireCanonicalId(
        payload.receivedBy,
        'receivedBy'
      ),

    lines:
      normalizeLines(payload.lines),

    status: 'draft',

    inventoryApplied: false,

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
  createWarehouseStockIntakeError,
  createWarehouseStockIntakeRecord,
};
