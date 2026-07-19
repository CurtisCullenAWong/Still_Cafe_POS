import { Platform } from "react-native";
import { printAsync } from "expo-print";
import { SaleItem, Settings } from "../types/db";

export const printHtml = async (html: string) => {
  if (Platform.OS === "web") {
    return new Promise<void>((resolve) => {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        resolve();
        return;
      }

      doc.open();
      doc.write(html);
      doc.close();

      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          resolve();
        }, 500);
      }, 250);
    });
  } else {
    await printAsync({ html, width: 576 });
  }
};

interface ReceiptData {
  items: SaleItem[];
  settings: Settings;
  checkoutDetails: {
    subtotalInclusive: number;
    vatAmount: number;
    discountAmount: number;
    finalAmount: number;
    discountType: "senior" | "pwd" | null;
  };
  paymentMethod: "cash" | "gcash";
  cashReceived: number;
  change: number;
  timestamp: Date;
  transactionId?: string;
  isReprint?: boolean;
}

export const generateReceiptHtml = (data: ReceiptData) => {
  const {
    items,
    settings,
    checkoutDetails,
    paymentMethod,
    cashReceived,
    change,
    timestamp,
    transactionId,
    isReprint,
  } = data;

  const formatDate = (date: Date) => {
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const rows = items
    .map(
      (item) => `
    <div class="item-row">
      <span class="qty">${item.quantity}</span>
      <span class="name">${item.product_name}</span>
      <span class="price">${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
  <style>
    @page {
      margin: 0;
      size: 80mm auto;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.3;
      color: #000;
      background: #fff;
      padding: 0;
      margin: 0 auto;
      width: 100%;
      max-width: 80mm;
    }

    .container {
      padding: 10px;
      width: 100%;
    }

    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }

    .header {
      margin-bottom: 12px;
      border-bottom: 1px dashed #666;
      padding-bottom: 8px;
    }

    .store-name {
      font-size: 16px;
      font-weight: bold;
      margin: 0 0 4px 0;
    }

    .meta {
      color: #333;
      font-size: 10px;
      margin: 2px 0;
    }

    .items-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dashed #666;
      padding-bottom: 4px;
      margin-bottom: 6px;
      font-weight: bold;
      font-size: 11px;
    }

    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;
      font-size: 11px;
    }

    .qty {
      width: 24px;
      font-weight: bold;
      flex-shrink: 0;
    }

    .name {
      flex: 1;
      padding-right: 6px;
      word-break: break-word;
    }

    .price {
      width: 60px;
      text-align: right;
      flex-shrink: 0;
    }

    .totals {
      margin-top: 10px;
      border-top: 1px dashed #666;
      padding-top: 8px;
    }

    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
      font-size: 11px;
    }

    .total-row {
      font-size: 13px;
      font-weight: bold;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      margin-top: 6px;
      padding: 4px 0;
    }

    .payment-section {
      margin-top: 10px;
      border-bottom: 1px dashed #666;
      padding-bottom: 8px;
    }

    .footer {
      margin-top: 12px;
      text-align: center;
      font-size: 10px;
      color: #444;
      padding-top: 6px;
    }

    .reprint-badge {
      border: 1px solid #000;
      padding: 2px 6px;
      display: inline-block;
      margin-top: 4px;
      font-weight: bold;
      font-size: 10px;
    }

    @media print {
      body {
        width: 80mm;
        margin: 0;
        padding: 0;
      }
      .container {
        padding: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header text-center">
      <div class="store-name uppercase">${settings.store_name}</div>
      <div class="meta uppercase font-bold">Official Receipt</div>
      ${isReprint ? '<div class="reprint-badge">*** REPRINT ***</div>' : ""}
      <div class="meta">${formatDate(timestamp)}</div>
      ${transactionId ? `<div class="meta">ID: ${transactionId.slice(0, 8)}</div>` : ""}
    </div>

    <div class="items-section">
      <div class="items-header">
        <span style="width: 24px;">Qty</span>
        <span style="flex: 1;">Item</span>
        <span style="width: 60px; text-align: right;">Amt</span>
      </div>
      
      ${rows}
    </div>

    <div class="totals">
      <div class="row">
        <span>Gross Amount (VAT Inc)</span>
        <span>₱${checkoutDetails.subtotalInclusive.toFixed(2)}</span>
      </div>
      
      ${
        checkoutDetails.discountType
          ? `
        <div class="row">
          <span>VAT Adjustment (Exempt)</span>
          <span>-₱${(checkoutDetails.subtotalInclusive - checkoutDetails.subtotalInclusive / (1 + (settings.vat_percentage || 12) / 100)).toFixed(2)}</span>
        </div>
        <div class="row">
          <span>VAT Exempt Sales</span>
          <span>₱${(checkoutDetails.subtotalInclusive / (1 + (settings.vat_percentage || 12) / 100)).toFixed(2)}</span>
        </div>
        <div class="row">
          <span style="text-transform: capitalize;">${checkoutDetails.discountType} Discount (20%)</span>
          <span>-₱${checkoutDetails.discountAmount.toFixed(2)}</span>
        </div>
      `
          : `
        <div class="row">
          <span>VATable Sales</span>
          <span>₱${(checkoutDetails.subtotalInclusive / (1 + (settings.vat_percentage || 12) / 100)).toFixed(2)}</span>
        </div>
        <div class="row">
          <span>VAT (${settings.vat_percentage ?? 12}%)</span>
          <span>₱${checkoutDetails.vatAmount.toFixed(2)}</span>
        </div>
      `
      }

      <div class="row total-row">
        <span>TOTAL AMOUNT DUE</span>
        <span>₱${checkoutDetails.finalAmount.toFixed(2)}</span>
      </div>
    </div>

    <div class="payment-section">
      <div class="row">
        <span class="uppercase">${paymentMethod === "cash" ? "CASH" : "GCASH"}</span>
        <span>₱${cashReceived.toFixed(2)}</span>
      </div>
      <div class="row font-bold">
        <span>CHANGE</span>
        <span>₱${change.toFixed(2)}</span>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 2px 0;">Thank you for your purchase!</p>
      <p style="margin: 2px 0;">Please come again.</p>
      <p style="margin-top: 8px;">Powered by Café POS</p>
    </div>
  </div>
</body>
</html>
  `;
};

export interface SalesReportData {
  dateRange: {
    start: Date;
    end: Date;
  };
  settings: Settings;
  stats: {
    grossSales: number;
    totalSales: number;
    totalTransactions: number;
    totalVat: number;
    totalDiscounts: number;
    vatableSales: number;
    vatExemptSales: number;
  };
}

export const generateSalesReportHtml = (data: SalesReportData) => {
  const { dateRange, settings, stats } = data;

  const formatDate = (date: Date) => {
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return (amount ?? 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
  <style>
    @page {
      margin: 0;
      size: 80mm auto;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.3;
      color: #000;
      background: #fff;
      padding: 0;
      margin: 0 auto;
      width: 100%;
      max-width: 80mm;
    }

    .container {
      padding: 10px;
      width: 100%;
    }

    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }

    .header {
      margin-bottom: 12px;
      border-bottom: 1px dashed #666;
      padding-bottom: 8px;
    }

    .store-name {
      font-size: 16px;
      font-weight: bold;
      margin: 0 0 4px 0;
    }

    .meta {
      color: #333;
      font-size: 10px;
      margin: 2px 0;
    }

    .section-title {
      font-weight: bold;
      border-bottom: 1px dashed #666;
      padding-bottom: 4px;
      margin-top: 10px;
      margin-bottom: 6px;
      font-size: 11px;
    }

    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
      font-size: 11px;
    }

    .footer {
      margin-top: 16px;
      text-align: center;
      font-size: 10px;
      color: #444;
      border-top: 1px dashed #666;
      padding-top: 8px;
    }

    @media print {
      body {
        width: 80mm;
        margin: 0;
        padding: 0;
      }
      .container {
        padding: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header text-center">
      <div class="store-name uppercase">${settings.store_name}</div>
      <div class="meta uppercase font-bold">Sales Report</div>
      <div class="meta">${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}</div>
      <div class="meta">Generated: ${new Date().toLocaleString()}</div>
    </div>

    <div class="section-title">SALES SUMMARY</div>
    
    <div class="row">
      <span>Transactions</span>
      <span>${stats.totalTransactions}</span>
    </div>

    <div class="row">
      <span>Gross Sales</span>
      <span>₱${formatCurrency(stats.grossSales)}</span>
    </div>

    <div class="row">
      <span>Discounts</span>
      <span>(₱${formatCurrency(stats.totalDiscounts)})</span>
    </div>

    <div class="row font-bold" style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 0; margin-top: 4px;">
      <span>NET SALES</span>
      <span>₱${formatCurrency(stats.totalSales)}</span>
    </div>

    <div class="section-title" style="margin-top: 12px;">TAX BREAKDOWN</div>

    <div class="row">
      <span>VATable Sales</span>
      <span>₱${formatCurrency(stats.vatableSales)}</span>
    </div>

    <div class="row">
      <span>VAT Exempt Sales</span>
      <span>₱${formatCurrency(stats.vatExemptSales)}</span>
    </div>

    <div class="row">
      <span>VAT Amount (${settings.vat_percentage}%)</span>
      <span>₱${formatCurrency(stats.totalVat)}</span>
    </div>

    <div class="footer">
      <p style="margin: 2px 0;">End of Report</p>
    </div>
  </div>
</body>
</html>
  `;
};
