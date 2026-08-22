'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

function loadPurchaseOrderFoundation() {
  try {
    return require(
      '../src/future/procurement/purchaseOrderFoundation'
    );
  } catch (error) {
    const message = String(error?.message || '');

    if (
      error?.code === 'MODULE_NOT_FOUND' &&
      message.includes(
        '../src/future/procurement/purchaseOrderFoundation'
      )
    ) {
      const intendedRed = new Error(
        'PURCHASE_ORDER_FOUNDATION_IMPLEMENTATION_MISSING'
      );

      intendedRed.code =
        'PURCHASE_ORDER_FOUNDATION_IMPLEMENTATION_MISSING';

      throw intendedRed;
    }

    throw error;
  }
}

test(
  'purchase order is tenant-scoped linked non-authoritative and rejects sensitive supplier data',
  () => {
    const {
      createPurchaseOrderRecord,
    } = loadPurchaseOrderFoundation();

    const record = createPurchaseOrderRecord({
      purchaseOrderId: 'purchase_order_demo_001',
      tenantId: 'tenant_demo_001',
      supplierId: 'supplier_demo_001',
      procurementRequestId: 'procurement_demo_001',
      createdBy: 'user_demo_001',
      lines: [
        {
          materialId: 'material_demo_001',
          quantity: 2,
          unitPrice: 100,
        },
      ],
    });

    assert.equal(
      record.purchaseOrderId,
      'purchase_order_demo_001'
    );
    assert.equal(record.tenantId, 'tenant_demo_001');
    assert.equal(record.supplierId, 'supplier_demo_001');
    assert.equal(
      record.procurementRequestId,
      'procurement_demo_001'
    );
    assert.equal(record.status, 'draft');
    assert.equal(record.governmentApproved, false);
    assert.equal(record.vendorApproved, false);
    assert.equal(record.financialAuthority, false);
    assert.equal(Object.isFrozen(record), true);

    assert.throws(
      () =>
        createPurchaseOrderRecord({
          purchaseOrderId: 'purchase_order_demo_002',
          tenantId: 'tenant_demo_001',
          supplierId: 'supplier_demo_001',
          procurementRequestId: 'procurement_demo_001',
          createdBy: 'user_demo_001',
          lines: [
            {
              materialId: 'material_demo_001',
              quantity: 1,
              unitPrice: 100,
            },
          ],
          supplierProfile: {
            bankAccountNumber: '[REDACTED]',
            aadhaarNumber: '[REDACTED]',
          },
        }),
      (error) =>
        error?.code ===
        'SENSITIVE_PURCHASE_ORDER_FIELD_PROHIBITED'
    );
  }
);
