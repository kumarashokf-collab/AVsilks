'use strict';

const ID_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

const SUPPLIER_TYPES =
  Object.freeze([
    'material-supplier',
    'yarn-supplier',
    'dye-supplier',
    'packaging-supplier',
    'service-supplier',
    'other',
  ]);

const ALLOWED_FIELDS =
  Object.freeze(
    new Set([
      'supplierId',
      'tenantId',
      'displayName',
      'supplierType',
      'active',
    ])
  );

const FORBIDDEN_SENSITIVE_KEYS =
  Object.freeze(
    new Set([
      'aadhaar',
      'aadhaarnumber',
      'governmentid',
      'governmentidentity',
      'govid',
      'kyc',
      'kycdocument',
      'kycdocumentnumber',
      'bankaccount',
      'bankaccountnumber',
      'accountnumber',
      'ifsc',
      'ifsccode',
      'pan',
      'pannumber',
    ])
  );

function createSupplierError(
  code,
  message,
  field = null
) {
  const error =
    new Error(message);

  error.code = code;

  if (field) {
    error.field = field;
  }

  return error;
}

function normalizeKey(
  key
) {
  return typeof key === 'string'
    ? key
        .replace(
          /[^A-Za-z0-9]/g,
          ''
        )
        .toLowerCase()
    : '';
}

function findSensitiveField(
  value
) {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return null;
  }

  if (
    Array.isArray(value)
  ) {
    for (const item of value) {
      const match =
        findSensitiveField(item);

      if (match) {
        return match;
      }
    }

    return null;
  }

  for (
    const [
      key,
      nestedValue,
    ] of Object.entries(value)
  ) {
    if (
      FORBIDDEN_SENSITIVE_KEYS.has(
        normalizeKey(key)
      )
    ) {
      return key;
    }

    const nestedMatch =
      findSensitiveField(
        nestedValue
      );

    if (nestedMatch) {
      return nestedMatch;
    }
  }

  return null;
}

function requireCanonicalId(
  value,
  field
) {
  if (
    typeof value !== 'string' ||
    !ID_PATTERN.test(
      value.trim()
    )
  ) {
    throw createSupplierError(
      'INVALID_SUPPLIER_IDENTITY',
      `${field} must be a canonical identifier.`,
      field
    );
  }

  return value.trim();
}

function requireDisplayName(
  value
) {
  if (
    typeof value !== 'string'
  ) {
    throw createSupplierError(
      'INVALID_SUPPLIER_DISPLAY_NAME',
      'displayName is required.',
      'displayName'
    );
  }

  const normalized =
    value.trim();

  if (
    normalized.length < 2 ||
    normalized.length > 160
  ) {
    throw createSupplierError(
      'INVALID_SUPPLIER_DISPLAY_NAME',
      'displayName length is invalid.',
      'displayName'
    );
  }

  return normalized;
}

function requireSupplierType(
  value
) {
  if (
    typeof value !== 'string' ||
    !SUPPLIER_TYPES.includes(value)
  ) {
    throw createSupplierError(
      'INVALID_SUPPLIER_TYPE',
      'supplierType is not allowed.',
      'supplierType'
    );
  }

  return value;
}

function rejectUnknownFields(
  payload
) {
  for (
    const key of Object.keys(payload)
  ) {
    if (
      !ALLOWED_FIELDS.has(key)
    ) {
      throw createSupplierError(
        'UNKNOWN_SUPPLIER_FIELD',
        'Supplier payload contains an unknown field.',
        key
      );
    }
  }
}

function createSupplierOperationalRecord(
  payload
) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    throw createSupplierError(
      'INVALID_SUPPLIER_PAYLOAD',
      'Supplier payload must be an object.'
    );
  }

  const sensitiveField =
    findSensitiveField(payload);

  if (sensitiveField) {
    throw createSupplierError(
      'SENSITIVE_SUPPLIER_FIELD_PROHIBITED',
      'Sensitive supplier identity or banking data is prohibited.',
      sensitiveField
    );
  }

  rejectUnknownFields(payload);

  const supplierId =
    requireCanonicalId(
      payload.supplierId,
      'supplierId'
    );

  const tenantId =
    requireCanonicalId(
      payload.tenantId,
      'tenantId'
    );

  const displayName =
    requireDisplayName(
      payload.displayName
    );

  const supplierType =
    requireSupplierType(
      payload.supplierType
    );

  if (
    payload.active !== undefined &&
    typeof payload.active !== 'boolean'
  ) {
    throw createSupplierError(
      'INVALID_SUPPLIER_ACTIVE_STATE',
      'active must be boolean.',
      'active'
    );
  }

  return Object.freeze({
    supplierId,
    tenantId,
    displayName,
    supplierType,

    active:
      payload.active === undefined
        ? true
        : payload.active,

    governmentApproved: false,
    vendorApproved: false,
    financialAuthority: false,
    approvalAuthoritySource: null,
  });
}

module.exports = {
  ID_PATTERN,
  SUPPLIER_TYPES,
  ALLOWED_FIELDS,
  FORBIDDEN_SENSITIVE_KEYS,
  createSupplierError,
  normalizeKey,
  findSensitiveField,
  createSupplierOperationalRecord,
};
