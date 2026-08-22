'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

function loadWarehouseStockIntakeFoundation() {
  try {
    return require(
      '../src/future/procurement/warehouseStockIntakeFoundation'
    );
  } catch (error) {
    const message = String(error?.message || '');

    if (
      error?.code === 'MODULE_NOT_FOUND' &&
      message.includes(
        '../src/future/procurement/warehouseStockIntakeFoundation'
      )
    ) {
      const intendedRed = new Error(
        'WAREHOUSE_STOCK_INTAKE_FOUNDATION_IMPLEMENTATION_MISSING'
      );

      intendedRed.code =
        'WAREHOUSE_STOCK_INTAKE_FOUNDATION_IMPLEMENTATION_MISSING';

      throw intendedRed;
    }

    throw error;
  }
}

test(
  'warehouse stock intake is tenant-scoped purchase-order-linked non-authoritative and rejects sensitive data',
  () => {
    const {
      createWarehouseStockIntakeRecord,
    } = loadWarehouseStockIntakeFoundation();

    const record =
      createWarehouseStockIntakeRecord({
        stockIntakeId: 'stock_intake_demo_001',
        tenantId: 'tenant_demo_001',
        warehouseId: 'warehouse_demo_001',
        purchaseOrderId: 'purchase_order_demo_001',
        receivedBy: 'user_demo_001',
        lines: [
          {
            materialId: 'material_demo_001',
            receivedQuantity: 2,
          },
        ],
      });

    assert.equal(
      record.stockIntakeId,
      'stock_intake_demo_001'
    );
    assert.equal(
      record.tenantId,
      'tenant_demo_001'
    );
    assert.equal(
      record.warehouseId,
      'warehouse_demo_001'
    );
    assert.equal(
      record.purchaseOrderId,
      'purchase_order_demo_001'
    );
    assert.equal(record.status, 'draft');
    assert.equal(record.inventoryApplied, false);
    assert.equal(record.governmentApproved, false);
    assert.equal(record.vendorApproved, false);
    assert.equal(record.financialAuthority, false);
    assert.equal(Object.isFrozen(record), true);

    assert.throws(
      () =>
        createWarehouseStockIntakeRecord({
          stockIntakeId:
            'stock_intake_demo_002',
          tenantId:
            'tenant_demo_001',
          warehouseId:
            'warehouse_demo_001',
          purchaseOrderId:
            'purchase_order_demo_001',
          receivedBy:
            'user_demo_001',
          lines: [
            {
              materialId:
                'material_demo_001',
              receivedQuantity: 1,
            },
          ],
          supplierProfile: {
            bankAccountNumber: '[REDACTED]',
            kycDocumentNumber: '[REDACTED]',
          },
        }),
      (error) =>
        error?.code ===
        'SENSITIVE_WAREHOUSE_STOCK_INTAKE_FIELD_PROHIBITED'
    );
  }
);
