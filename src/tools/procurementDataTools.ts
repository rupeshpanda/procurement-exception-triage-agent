import { invoiceExceptions } from "@/data/invoiceExceptions";
import { purchaseOrders } from "@/data/purchaseOrders";
import { vendorHistory } from "@/data/vendorHistory";
import { failTool, succeedTool } from "@/errors/toolError";
import {
  searchInvoiceExceptionsSchema,
  searchPurchaseOrdersSchema,
  searchVendorHistorySchema
} from "@/tools/toolSchemas";
import type {
  SearchInvoiceExceptionsInput,
  SearchPurchaseOrdersInput,
  SearchVendorHistoryInput
} from "@/types/tools";

function includesText(value: string | undefined, query: string | undefined) {
  if (!query) {
    return true;
  }

  return value?.toLowerCase().includes(query.toLowerCase()) ?? false;
}

export function searchPurchaseOrders(input: SearchPurchaseOrdersInput) {
  const parsed = searchPurchaseOrdersSchema.safeParse(input);
  if (!parsed.success) {
    return failTool("validation", "Invalid purchase order search input.", {
      reason: parsed.error.flatten()
    });
  }

  const { vendorName, poNumber, status, maxResults } = parsed.data;
  const filtered = purchaseOrders
    .filter((po) => includesText(po.vendorName, vendorName))
    .filter((po) => includesText(po.poNumber, poNumber))
    .filter((po) => status === "any" || po.status === status)
    .slice(0, maxResults);

  return succeedTool({ purchaseOrders: filtered });
}

export function searchInvoiceExceptions(input: SearchInvoiceExceptionsInput) {
  const parsed = searchInvoiceExceptionsSchema.safeParse(input);
  if (!parsed.success) {
    return failTool("validation", "Invalid invoice exception search input.", {
      reason: parsed.error.flatten()
    });
  }

  const { vendorName, invoiceNumber, exceptionType, maxResults } = parsed.data;
  const filtered = invoiceExceptions
    .filter((invoice) => includesText(invoice.vendorName, vendorName))
    .filter((invoice) => includesText(invoice.invoiceNumber, invoiceNumber))
    .filter(
      (invoice) => exceptionType === "any" || invoice.exceptionType === exceptionType
    )
    .slice(0, maxResults);

  return succeedTool({ invoiceExceptions: filtered });
}

export function searchVendorHistory(input: SearchVendorHistoryInput) {
  const parsed = searchVendorHistorySchema.safeParse(input);
  if (!parsed.success) {
    return failTool("validation", "Invalid vendor history search input.", {
      reason: parsed.error.flatten()
    });
  }

  const record = vendorHistory.find((vendor) =>
    includesText(vendor.vendorName, parsed.data.vendorName)
  );

  if (!record) {
    return failTool("validation", "No vendor history was found for that vendor.", {
      field: "vendorName"
    });
  }

  return succeedTool({ vendorHistory: record });
}
