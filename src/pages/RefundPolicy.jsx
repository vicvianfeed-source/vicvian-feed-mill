import React from "react";
import LegalPage from "@/components/legal/LegalPage";

export default function RefundPolicy() {
  return (
    <LegalPage title="Refund and Return Policy" lastUpdated="September 21, 2026">
      <p>This Refund Policy applies to transactions recorded through the Vicvian IMS Service. It outlines the conditions under which refunds, returns, or cancellations may be processed.</p>

      <h2 className="text-xl font-semibold mt-6">1. Scope</h2>
      <p>This policy covers sales of feed mill products, fish farm products, equipment rental charges, and service charges (grinding, pelleting) recorded through the Service. Terms may vary by transaction type and are subject to any separate written agreements with customers.</p>

      <h2 className="text-xl font-semibold mt-6">2. Product Sales (Feed and Fish)</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Defective products:</strong> If a product is found to be defective at the time of delivery, customers may request a replacement or refund within 48 hours of purchase. Proof of purchase and the defective product may be required.</li>
        <li><strong>Non-defective products:</strong> Due to the nature of agricultural feed and fish products, returns of non-defective items are generally not accepted unless a separate agreement exists.</li>
        <li><strong>Refund method:</strong> Approved refunds will be issued to the original payment method within 7–14 business days.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6">3. Equipment Rentals</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Cancellation before rental start:</strong> Full refund if cancelled at least 24 hours before the rental start date.</li>
        <li><strong>Early return:</strong> No partial refund for early return unless previously agreed in writing.</li>
        <li><strong>Late returns:</strong> Additional charges apply per the daily rate for each day beyond the agreed rental period.</li>
        <li><strong>Damage:</strong> Customers are responsible for damage to rental equipment. Repair or replacement costs will be deducted from any refund or charged separately.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6">4. Service Charges (Grinding and Pelleting)</h2>
      <p>Service charges for grinding and pelleting are due upon completion of the service. If a service is not completed due to equipment failure on our part, a full refund or re-service will be provided. Refunds are not available for services already completed and accepted by the customer.</p>

      <h2 className="text-xl font-semibold mt-6">5. Voided Transactions</h2>
      <p>Transactions recorded in error may be voided by an administrator. Voided transactions reverse the recorded sale and restore inventory. If payment was already collected, a refund will be processed to the original payment method.</p>

      <h2 className="text-xl font-semibold mt-6">6. How to Request a Refund</h2>
      <p>To request a refund, contact us at vicvianfeed@gmail.com with the following information:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Transaction date and reference number</li>
        <li>Product or service description</li>
        <li>Reason for refund request</li>
        <li>Original payment method</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6">7. Processing Time</h2>
      <p>Approved refunds will be processed within 7–14 business days, depending on the payment method and financial institution. Cash refunds may be processed immediately at the point of sale.</p>

      <h2 className="text-xl font-semibold mt-6">8. Contact</h2>
      <p>For questions about refunds, contact us at vicvianfeed@gmail.com.</p>
    </LegalPage>
  );
}