import { SaleItem, Settings } from "../types/db";

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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime&display=swap');
    
    @page {
      margin: 0;
      size: auto;
    }

    body {
      font-family: 'Courier Prime', 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.2;
      color: #000;
      background: #fff;
      padding: 0;
      margin: 0;
      width: 100%;
    }

    .container {
      padding: 5px;
    }

    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { fontWeight: bold; }
    .uppercase { text-transform: uppercase; }

    .header {
      margin-bottom: 15px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
    }

    .store-name {
      font-size: 16px;
      font-weight: bold;
      margin: 0 0 5px 0;
    }

    .meta {
      color: #555;
      font-size: 10px;
      margin: 2px 0;
    }

    .items-header {
      display: grid;
      grid-template-columns: 30px 1fr 60px;
      border-bottom: 1px dashed #aaa;
      padding-bottom: 5px;
      margin-bottom: 5px;
      font-weight: bold;
      font-size: 10px;
    }

    .item-row {
      display: grid;
      grid-template-columns: 30px 1fr 60px;
      margin-bottom: 4px;
    }

    .name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-right: 5px;
    }

    .totals {
      margin-top: 15px;
      border-top: 1px dashed #aaa;
      padding-top: 10px;
    }

    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }

    .total-row {
      font-size: 14px;
      font-weight: bold;
      border-top: 1px solid #ddd;
      margin-top: 5px;
      padding-top: 5px;
    }

    .payment-section {
      margin-top: 15px;
    }

    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 10px;
      color: #888;
      border-top: 1px solid #eee;
      padding-top: 10px;
    }

    .reprint-badge {
      border: 1px solid #000;
      padding: 2px 5px;
      display: inline-block;
      margin-top: 5px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header text-center">
      <div class="store-name uppercase">${settings.store_name}</div>
      <div class="meta uppercase">Official Receipt</div>
      <div class="meta">${formatDate(timestamp)}</div>
      ${transactionId ? `<div class="meta">ID: ${transactionId.slice(0, 8)}</div>` : ""}
      ${isReprint ? `<div class="reprint-badge">REPRINT</div>` : ""}
    </div>

    <div class="items-section">
      <div class="items-header">
        <span>Qty</span>
        <span>Item</span>
        <span class="text-right">Amt</span>
      </div>
      
      ${rows}
    </div>

    <div class="totals">
      <div class="row">
        <span>Gross Amount (VAT Inc)</span>
        <span>${checkoutDetails.subtotalInclusive.toFixed(2)}</span>
      </div>
      
      ${
        checkoutDetails.discountType
          ? `
        <div class="row">
          <span>VAT Adjustment (Exempt)</span>
          <span>-${(checkoutDetails.subtotalInclusive - checkoutDetails.subtotalInclusive / (1 + (settings.vat_percentage || 12) / 100)).toFixed(2)}</span>
        </div>
        <div class="row">
          <span>VAT Exempt Sales</span>
          <span>${(checkoutDetails.subtotalInclusive / (1 + (settings.vat_percentage || 12) / 100)).toFixed(2)}</span>
        </div>
        <div class="row">
          <span style="text-transform: capitalize;">${checkoutDetails.discountType} Discount (20%)</span>
          <span>-${checkoutDetails.discountAmount.toFixed(2)}</span>
        </div>
      `
          : `
        <div class="row">
          <span>VATable Sales</span>
          <span>${(checkoutDetails.subtotalInclusive / (1 + (settings.vat_percentage || 12) / 100)).toFixed(2)}</span>
        </div>
        <div class="row">
          <span>VAT (${settings.vat_percentage ?? 12}%)</span>
          <span>${checkoutDetails.vatAmount.toFixed(2)}</span>
        </div>
      `
      }

      <div class="row total-row">
        <span>TOTAL AMOUNT DUE</span>
        <span>${checkoutDetails.finalAmount.toFixed(2)}</span>
      </div>
    </div>

    <div class="payment-section">
      <div class="row">
        <span class="uppercase">${paymentMethod === "cash" ? "CASH" : "GCASH"}</span>
        <span>${cashReceived.toFixed(2)}</span>
      </div>
      <div class="row font-bold">
        <span>CHANGE</span>
        <span>${change.toFixed(2)}</span>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for your purchase!</p>
      <p>Please come again.</p>
      <p style="margin-top: 10px;">Powered by Café POS</p>
    </div>
  </div>
</body>
</html>
  `;
};
