import React from "react";
import LegalPage from "@/components/legal/LegalPage";

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="September 21, 2026">
      <p>Vicvian IMS ("we", "us", or "our") operates the Vicvian Inventory Management System (the "Service"). This Privacy Policy explains how we collect, use, and protect your personal data when you use our Service.</p>

      <h2 className="text-xl font-semibold mt-6">1. Data Controller</h2>
      <p>Vicvian IMS is the data controller for the personal data processed through this Service. For data protection enquiries, contact us at vicvianfeed@gmail.com.</p>

      <h2 className="text-xl font-semibold mt-6">2. Personal Data We Collect</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Account data:</strong> Your full name, email address, and password (hashed) when you register or log in.</li>
        <li><strong>Role and access data:</strong> Your assigned role (admin, manager, or operator) within the system.</li>
        <li><strong>Operational data:</strong> Records you create including sales, purchases, expenses, production batches, service jobs, rentals, and audit log entries attributed to your account.</li>
        <li><strong>CRM data:</strong> Customer and lead contact information (names, phone numbers, emails, company names, notes) entered by authorised users.</li>
        <li><strong>Usage data:</strong> IP address, browser type, and access times collected automatically by the hosting platform for security and service operation.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6">3. Legal Basis for Processing</h2>
      <p>We process your personal data on the following legal bases under GDPR:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Contract (Art. 6(1)(b)):</strong> To provide and manage your account and the Service you requested.</li>
        <li><strong>Legal obligation (Art. 6(1)(c)):</strong> To maintain financial and operational records required by applicable law.</li>
        <li><strong>Legitimate interests (Art. 6(1)(f)):</strong> For security, audit logging, and service improvement.</li>
        <li><strong>Consent (Art. 6(1)(a)):</strong> For any optional processing where you have given explicit consent, which you may withdraw at any time.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6">4. How We Use Your Data</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>To authenticate you and manage access to the Service.</li>
        <li>To record and display operational transactions attributed to your account.</li>
        <li>To maintain an audit trail of changes for accountability.</li>
        <li>To send service-related notifications (e.g., password resets, account deletion confirmations).</li>
        <li>To generate aggregated business reports that do not identify individuals.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6">5. Data Sharing and Processors</h2>
      <p>We do not sell your personal data. We share data only with:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Base44 (platform provider):</strong> Acts as a data processor, hosting the application, database, and authentication infrastructure.</li>
        <li><strong>Google:</strong> For Google Fonts and optional Google OAuth sign-in, subject to Google's privacy policy.</li>
        <li><strong>Giphy:</strong> A GIF is embedded on the dashboard for decorative purposes; Giphy may set cookies — see our Cookie Policy.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6">6. Data Retention</h2>
      <p>We retain your personal data for as long as your account is active. Operational records (sales, purchases, expenses, audit logs) are retained for the duration required by applicable accounting and tax laws (typically 5–7 years). You may request deletion of your account at any time via Account Settings.</p>

      <h2 className="text-xl font-semibold mt-6">7. Your Rights Under GDPR</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Right of access:</strong> Request a copy of your personal data.</li>
        <li><strong>Right to rectification:</strong> Correct inaccurate or incomplete data.</li>
        <li><strong>Right to erasure:</strong> Request deletion of your data ("right to be forgotten").</li>
        <li><strong>Right to restrict processing:</strong> Limit how we use your data.</li>
        <li><strong>Right to data portability:</strong> Receive your data in a structured, machine-readable format.</li>
        <li><strong>Right to object:</strong> Object to processing based on legitimate interests.</li>
        <li><strong>Right to withdraw consent:</strong> Withdraw consent for consent-based processing at any time.</li>
      </ul>
      <p>To exercise any of these rights, contact us at vicvianfeed@gmail.com. You also have the right to lodge a complaint with your local data protection authority.</p>

      <h2 className="text-xl font-semibold mt-6">8. Security</h2>
      <p>We implement appropriate technical and organisational measures to protect your data, including encrypted password hashing, role-based access control, row-level security on all data entities, and audit logging of sensitive operations.</p>

      <h2 className="text-xl font-semibold mt-6">9. International Transfers</h2>
      <p>Your data may be processed by our hosting provider in data centres outside the EU/EEA. We rely on Standard Contractual Clauses (SCCs) or other appropriate safeguards as required by GDPR for such transfers.</p>

      <h2 className="text-xl font-semibold mt-6">10. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy within the Service. Continued use after changes constitutes acceptance.</p>
    </LegalPage>
  );
}