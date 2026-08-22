'use strict';

const {
  ID_PATTERN,
  findSensitiveField,
} = require('./supplierFoundation');

const ALLOWED_FIELDS = Object.freeze(
  new Set([
    'procurementRequestId',
    'tenantId',
    'supplierId',
    'requestedBy',
    'lines',
  ])
);

function createProcurementRequestError(
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
    throw createProcurementRequestError(
      'INVALID_PROCUREMENT_IDENTITY',
      `${field} must be a canonical identifier.`,
      field
    );
  }

  return value.trim();
}

function rejectUnknownFields(payload) {
  for (const key of Object.keys(payload)) {
    if (!ALLOWED_FIELDS.has(key)) {
      throw createProcurementRequestError(
        'UNKNOWN_PROCUREMENT_FIELD',
        'Procurement request contains an unknown field.',
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
    throw createProcurementRequestError(
      'INVALID_PROCUREMENT_LINES',
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
      throw createProcurementRequestError(
        'INVALID_PROCUREMENT_LINE',
        'Each procurement line must be an object.',
        'lines'
      );
    }

    const allowedLineFields =
      new Set(['materialId', 'quantity']);

    for (const key of Object.keys(line)) {
      if (!allowedLineFields.has(key)) {
        throw createProcurementRequestError(
          'UNKNOWN_PROCUREMENT_LINE_FIELD',
          'Procurement line contains an unknown field.',
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
      !Number.isSafeInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > 100000
    ) {
      throw createProcurementRequestError(
        'INVALID_PROCUREMENT_QUANTITY',
        'quantity must be a positive safe integer.',
        'quantity'
      );
    }

    return Object.freeze({
      materialId,
      quantity: line.quantity,
    });
  });

  return Object.freeze(normalized);
}

function createProcurementRequestRecord(payload) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    throw createProcurementRequestError(
      'INVALID_PROCUREMENT_PAYLOAD',
      'Procurement request payload must be an object.'
    );
  }

  const sensitiveField =
    findSensitiveField(payload);

  if (sensitiveField) {
    throw createProcurementRequestError(
      'SENSITIVE_PROCUREMENT_FIELD_PROHIBITED',
      'Sensitive supplier identity or banking data is prohibited.',
      sensitiveField
    );
  }

  rejectUnknownFields(payload);

  const record = {
    procurementRequestId:
      requireCanonicalId(
        payload.procurementRequestId,
        'procurementRequestId'
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

    requestedBy:
      requireCanonicalId(
        payload.requestedBy,
        'requestedBy'
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
  createProcurementRequestError,
  createProcurementRequestRecord,
};
