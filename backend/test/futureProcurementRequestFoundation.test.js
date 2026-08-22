'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

function loadProcurementRequestFoundation() {
  try {
    return require(
      '../src/future/procurement/procurementRequestFoundation'
    );
  } catch (error) {
    const message = String(error?.message || '');

    if (
      error?.code === 'MODULE_NOT_FOUND' &&
      message.includes(
        '../src/future/procurement/procurementRequestFoundation'
      )
    ) {
      const intendedRed = new Error(
        'PROCUREMENT_REQUEST_FOUNDATION_IMPLEMENTATION_MISSING'
      );

      intendedRed.code =
        'PROCUREMENT_REQUEST_FOUNDATION_IMPLEMENTATION_MISSING';

      throw intendedRed;
    }

    throw error;
  }
}

test(
  'procurement request is tenant-scoped non-authoritative and rejects sensitive supplier data',
  () => {
    const {
      createProcurementRequestRecord,
    } = loadProcurementRequestFoundation();

    const record = createProcurementRequestRecord({
      procurementRequestId: 'procurement_demo_001',
      tenantId: 'tenant_demo_001',
      supplierId: 'supplier_demo_001',
      requestedBy: 'user_demo_001',
      lines: [
        {
          materialId: 'material_demo_001',
          quantity: 2,
        },
      ],
    });

    assert.equal(record.status, 'draft');
    assert.equal(record.governmentApproved, false);
    assert.equal(record.vendorApproved, false);
    assert.equal(record.financialAuthority, false);
    assert.equal(Object.isFrozen(record), true);

    assert.throws(
      () =>
        createProcurementRequestRecord({
          procurementRequestId: 'procurement_demo_002',
          tenantId: 'tenant_demo_001',
          supplierId: 'supplier_demo_001',
          requestedBy: 'user_demo_001',
          lines: [
            {
              materialId: 'material_demo_001',
              quantity: 1,
            },
          ],
          supplierProfile: {
            bankAccountNumber: '[REDACTED]',
          },
        }),
      (error) =>
        error?.code ===
        'SENSITIVE_PROCUREMENT_FIELD_PROHIBITED'
    );
  }
);
