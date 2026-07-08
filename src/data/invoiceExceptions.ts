import type { InvoiceException } from "@/types/procurement";

export const invoiceExceptions: InvoiceException[] = [
  {
    invoiceNumber: "INV-90031",
    sapInvoiceDocNumber: "5105690031",
    fiscalYear: "2026",
    vendorName: "Apex Industrial Supplies",
    amount: 42000,
    currency: "USD",
    exceptionType: "missing_goods_receipt",
    status: "open",
    relatedPoNumber: "PO-10441",
    paymentBlockCode: "R",
    sapBlockingMessage:
      "M8 504 Quantity invoiced greater than goods receipt quantity",
    threeWayMatch: {
      poQuantity: 40,
      goodsReceiptQuantity: 0,
      invoiceQuantity: 40,
      poUnitPrice: 1050,
      invoiceUnitPrice: 1050,
      unit: "EA"
    },
    description:
      "Invoice is blocked in invoice verification because no goods receipt has been posted for the related delayed purchase order. Three-way match fails on quantity: 40 invoiced vs 0 received."
  },
  {
    invoiceNumber: "INV-90032",
    sapInvoiceDocNumber: "5105690032",
    fiscalYear: "2026",
    vendorName: "Apex Industrial Supplies",
    amount: 18400,
    currency: "USD",
    exceptionType: "quantity_variance",
    status: "under_review",
    relatedPoNumber: "PO-10442",
    paymentBlockCode: "R",
    sapBlockingMessage:
      "M8 504 Quantity invoiced greater than goods receipt quantity",
    threeWayMatch: {
      poQuantity: 200,
      goodsReceiptQuantity: 120,
      invoiceQuantity: 200,
      poUnitPrice: 92,
      invoiceUnitPrice: 92,
      unit: "EA"
    },
    description:
      "Invoice quantity of 200 exceeds the partial goods receipt quantity of 120 and requires buyer review before the payment block can be lifted."
  },
  {
    invoiceNumber: "INV-77210",
    sapInvoiceDocNumber: "5105677210",
    fiscalYear: "2026",
    vendorName: "Northstar Components",
    amount: 9600,
    currency: "USD",
    exceptionType: "price_variance",
    status: "resolved",
    relatedPoNumber: "PO-10499",
    paymentBlockCode: "",
    sapBlockingMessage: "M8 083 Price too high (tolerance limit exceeded)",
    threeWayMatch: {
      poQuantity: 60,
      goodsReceiptQuantity: 60,
      invoiceQuantity: 60,
      poUnitPrice: 155,
      invoiceUnitPrice: 160,
      unit: "EA"
    },
    description:
      "Invoice unit price of 160 exceeded the PO price of 155 beyond tolerance. Resolved after contract price confirmation; the payment block was removed by the buyer."
  },
  {
    invoiceNumber: "INV-88452",
    sapInvoiceDocNumber: "5105688452",
    fiscalYear: "2026",
    vendorName: "Meridian Logistics Group",
    amount: 67500,
    currency: "USD",
    exceptionType: "payment_block",
    status: "escalated",
    relatedPoNumber: "PO-10512",
    paymentBlockCode: "A",
    sapBlockingMessage: "Payment block A set manually pending vendor dispute review",
    threeWayMatch: {
      poQuantity: 12,
      goodsReceiptQuantity: 0,
      invoiceQuantity: 12,
      poUnitPrice: 5625,
      invoiceUnitPrice: 5625,
      unit: "EA"
    },
    description:
      "Invoice carries a manual payment block while a delivery dispute with the vendor is under review. The purchase order is 21 days overdue with no goods receipt posted."
  }
];
