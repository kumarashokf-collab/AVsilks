'use strict';

const test =
  require('node:test');

const assert =
  require('node:assert/strict');

function loadSupplierFoundation() {
  try {
    return require(
      '../src/future/procurement/supplierFoundation'
    );
  } catch (error) {
    const message =
      String(
        error?.message || ''
      );

    if (
      error?.code ===
        'MODULE_NOT_FOUND' &&
      message.includes(
        '../src/future/procurement/supplierFoundation'
      )
    ) {
      const intendedRed =
        new Error(
          'SUPPLIER_FOUNDATION_IMPLEMENTATION_MISSING'
        );

      intendedRed.code =
        'SUPPLIER_FOUNDATION_IMPLEMENTATION_MISSING';

      throw intendedRed;
    }

    throw error;
  }
}

test(
  'supplier operational record is non-authoritative and rejects sensitive fields',
  () => {
    const {
      createSupplierOperationalRecord,
    } =
      loadSupplierFoundation();

    assert.equal(
      typeof createSupplierOperationalRecord,
      'function'
    );

    const safeRecord =
      createSupplierOperationalRecord({
        supplierId:
          'supplier_demo_001',

        tenantId:
          'tenant_demo_001',

        displayName:
          'Demo Supplier',

        supplierType:
          'material-supplier',

        active:
          true,
      });

    assert.equal(
      safeRecord.supplierId,
      'supplier_demo_001'
    );

    assert.equal(
      safeRecord.tenantId,
      'tenant_demo_001'
    );

    assert.equal(
      safeRecord.governmentApproved,
      false
    );

    assert.equal(
      safeRecord.vendorApproved,
      false
    );

    assert.equal(
      safeRecord.financialAuthority,
      false
    );

    assert.equal(
      Object.isFrozen(
        safeRecord
      ),
      true
    );

    assert.throws(
      () =>
        createSupplierOperationalRecord({
          supplierId:
            'supplier_demo_002',

          tenantId:
            'tenant_demo_001',

          displayName:
            'Sensitive Supplier',

          supplierType:
            'material-supplier',

          bankAccountNumber:
            '[REDACTED]',

          active:
            true,
        }),
      (error) =>
        error?.code ===
        'SENSITIVE_SUPPLIER_FIELD_PROHIBITED'
    );

    assert.throws(
      () =>
        createSupplierOperationalRecord({
          supplierId:
            'supplier_demo_003',

          tenantId:
            'tenant_demo_001',

          displayName:
            'KYC Supplier',

          supplierType:
            'material-supplier',

          kycDocument:
            '[KYC_DOCUMENT_REDACTED]',

          active:
            true,
        }),
      (error) =>
        error?.code ===
        'SENSITIVE_SUPPLIER_FIELD_PROHIBITED'
    );
  }
);
