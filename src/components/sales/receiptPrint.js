import { fmtMoney } from "@/lib/format";

export function printReceipt(sale, opts = {}) {
  const date = sale.sale_date || new Date(sale.created_date).toLocaleDateString();
  const receiptNo = sale.id?.slice(-8).toUpperCase() || "—";
  const customer = sale.customer_name || "Walk-in customer";
  const businessName = opts.businessName || "AgroMill IMS";

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Receipt ${receiptNo}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #000;
    margin: 0;
    padding: 0;
    width: 72mm;
  }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .lg { font-size: 16px; }
  .divider { border-top: 1px dashed #000; margin: 6px 0; }
  .double { border-top: 2px solid #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1px 0; vertical-align: top; }
  .muted { font-size: 10px; }
  .row { display: flex; justify-content: space-between; }
  .logo { font-size: 18px; font-weight: bold; letter-spacing: 1px; }
  .footer { margin-top: 8px; }
</style>
</head>
<body>
  <div class="center">
    <div class="logo">${businessName}</div>
    <div class="muted">Feed Mill &middot; Fish Farm &middot; Services</div>
  </div>
  <div class="divider"></div>
  <div class="center bold">RECEIPT</div>
  <div class="muted center">Receipt No: ${receiptNo}</div>
  <div class="divider"></div>
  <div class="row"><span>Date:</span><span>${date}</span></div>
  <div class="row"><span>Customer:</span><span>${customer}</span></div>
  <div class="row"><span>Served by:</span><span>${opts.operatorName || sale.operator_email || "—"}</span></div>
  <div class="divider"></div>
  <table>
    <tr>
      <td class="bold">Item</td>
      <td class="bold right">Amt</td>
    </tr>
    <tr>
      <td>${sale.product_name || "—"}</td>
      <td></td>
    </tr>
    <tr>
      <td class="muted">${sale.quantity} x ${fmtMoney(sale.unit_price)}</td>
      <td class="right">${fmtMoney(sale.total)}</td>
    </tr>
  </table>
  <div class="double"></div>
  <div class="row bold lg">
    <span>TOTAL</span>
    <span>${fmtMoney(sale.total)}</span>
  </div>
  <div class="divider"></div>
  <div class="row"><span>Payment:</span><span>${sale.status === "void" ? "VOID" : "Paid"}</span></div>
  <div class="divider"></div>
  <div class="footer center muted">
    Thank you for your business!<br/>
    Goods once sold are not returnable.<br/>
    ${new Date().toLocaleString()}
  </div>
  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    };
  </script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=340,height=600");
  if (!w) {
    alert("Please allow pop-ups to print receipts.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}