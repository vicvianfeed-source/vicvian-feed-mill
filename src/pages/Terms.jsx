import React from "react";
import LegalPage from "@/components/legal/LegalPage";

export default function Terms() {
  return (
    <LegalPage title="Terms and Conditions" lastUpdated="September 21, 2026">
      <p>Welcome to Vicvian IMS. By creating an account or using this Service, you agree to these Terms and Conditions. Please read them carefully.</p>

      <h2 className="text-xl font-semibold mt-6">1. Service Description</h2>
      <p>Vicvian IMS is an internal inventory and operations management system for feed mill, fish farm, and equipment rental operations. The Service includes sales recording, procurement tracking, expense management, production batch tracking, rental management, pricing management, customer relationship management, and business reporting.</p>

      <h2 className="text-xl font-semibold mt-6">2. Eligibility and Account</h2>
      <p>You must be invited by an administrator to use this Service. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account. You must be at least 18 years old to use this Service.</p>

      <h2 className="text-xl font-semibold mt-6">3. User Roles and Permissions</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Admin:</strong> Full access to all features, data, user management, and system configuration.</li>
        <li><strong>Manager:</strong> Access to operational data, reporting, and CRM functions.</li>
        <li><strong>Operator:</strong> Limited to recording transactions; no access to historical data or financial summaries.</li>
      </ul>
      <p>You must use the Service only within the permissions granted to your role. Attempting to circumvent access controls is a breach of these Terms.</p>

      <h2 className="text-xl font-semibold mt-6">4. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Use the Service for any unlawful purpose.</li>
        <li>Enter false, misleading, or fraudulent transaction data.</li>
        <li>Share your account credentials with unauthorized persons.</li>
        <li>Attempt to access data or features beyond your role.</li>
        <li>Use the Service to store or transmit malware or malicious content.</li>
        <li>Scrape, export, or copy data without authorization.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6">5. Data Accuracy</h2>
      <p>You are responsible for the accuracy of the data you enter. The Service relies on accurate input for financial reporting, inventory management, and audit trails. Vicvian IMS is not liable for losses arising from inaccurate data entry by users.</p>

      <h2 className="text-xl font-semibold mt-6">6. Intellectual Property</h2>
      <p>The Service, its design, and its software are owned by Vicvian IMS and/or its licensors. You retain ownership of the business data you enter. You are granted a limited, non-exclusive, non-transferable licence to use the Service for your internal business operations.</p>

      <h2 className="text-xl font-semibold mt-6">7. Third-Party Services</h2>
      <p>The Service integrates with third-party providers including Google (fonts, authentication), Giphy (decorative media), and the Base44 hosting platform. Each third-party service has its own terms and privacy policy. We are not responsible for the practices of these third parties.</p>

      <h2 className="text-xl font-semibold mt-6">8. Service Availability</h2>
      <p>We strive to maintain high availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. We are not liable for losses arising from Service downtime.</p>

      <h2 className="text-xl font-semibold mt-6">9. Limitation of Liability</h2>
      <p>To the maximum extent permitted by law, Vicvian IMS shall not be liable for any indirect, incidental, consequential, or financial losses arising from your use of the Service. Our total liability shall not exceed the fees paid by you for the Service in the 12 months preceding the claim.</p>

      <h2 className="text-xl font-semibold mt-6">10. Termination</h2>
      <p>We may suspend or terminate your access at any time for breach of these Terms. You may request account deletion at any time via Account Settings. Upon termination, your right to use the Service ceases immediately. Operational data you entered may be retained per our Privacy Policy and applicable accounting laws.</p>

      <h2 className="text-xl font-semibold mt-6">11. Governing Law</h2>
      <p>These Terms are governed by the laws of the jurisdiction in which Vicvian IMS operates. For users in the EU/EEA, the GDPR and applicable local data protection laws apply. Disputes shall be resolved in the courts of competent jurisdiction.</p>

      <h2 className="text-xl font-semibold mt-6">12. Changes to Terms</h2>
      <p>We may update these Terms from time to time. We will notify you of material changes within the Service. Continued use after changes constitutes acceptance of the updated Terms.</p>

      <h2 className="text-xl font-semibold mt-6">13. Contact</h2>
      <p>For questions about these Terms, contact us at vicvianfeed@gmail.com.</p>
    </LegalPage>
  );
}