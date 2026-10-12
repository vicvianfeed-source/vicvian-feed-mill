import React from "react";
import LegalPage from "@/components/legal/LegalPage";

export default function CookiePolicy() {
  return (
    <LegalPage title="Cookie Policy" lastUpdated="September 21, 2026">
      <p>This Cookie Policy explains how Vicvian IMS uses cookies and similar technologies when you use our Service. This policy should be read alongside our Privacy Policy.</p>

      <h2 className="text-xl font-semibold mt-6">1. What Are Cookies?</h2>
      <p>Cookies are small text files stored on your device when you visit a website. They are widely used to make websites work efficiently and to provide information to site owners.</p>

      <h2 className="text-xl font-semibold mt-6">2. Types of Cookies We Use</h2>

      <h3 className="text-lg font-semibold mt-4">Essential Cookies (No Consent Required)</h3>
      <p>These cookies are strictly necessary for the Service to function. Without them, features like authentication and security cannot operate.</p>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Authentication session cookie:</strong> Identifies you as logged in and maintains your session. Deleted when you log out or close the browser.</li>
        <li><strong>Security tokens:</strong> Protect against unauthorised access and CSRF attacks.</li>
      </ul>

      <h3 className="text-lg font-semibold mt-4">Non-Essential Cookies (Consent Required)</h3>
      <p>The following third-party resources may set cookies or similar tracking technologies. You can control these via our cookie consent banner:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Google Fonts:</strong> Loaded via CSS for typography. Google may collect your IP address. See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google's Privacy Policy</a>.</li>
        <li><strong>Giphy:</strong> A decorative GIF embedded on the dashboard. Giphy may set cookies and collect usage data. See <a href="https://support.giphy.com/hc/en-us/articles/360032574271-GIPHY-Privacy-Policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Giphy's Privacy Policy</a>.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6">3. Local Storage</h2>
      <p>In addition to cookies, the Service may use browser local storage to remember your preferences (such as dark/light theme toggle and cookie consent choice). This data is stored on your device and is not transmitted to our servers.</p>

      <h2 className="text-xl font-semibold mt-6">4. Managing Cookies</h2>
      <p>You can control and delete cookies through your browser settings. Note that disabling essential cookies will prevent you from logging in and using the Service.</p>
      <ul className="list-disc pl-6 space-y-1">
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary underline">Chrome cookie settings</a></li>
        <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-primary underline">Firefox cookie settings</a></li>
        <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary underline">Safari cookie settings</a></li>
      </ul>

      <h2 className="text-xl font-semibold mt-6">5. Cookie Consent</h2>
      <p>When you first visit the Service, you will see a cookie consent banner. You may accept all cookies or accept only essential cookies. Your choice is stored in local storage and you will not be asked again unless you clear your browser data. You can change your preference at any time by clearing your local storage or contacting us.</p>

      <h2 className="text-xl font-semibold mt-6">6. Analytics</h2>
      <p>The Service does not currently use third-party analytics cookies (such as Google Analytics). If we add analytics in the future, we will update this policy and seek your consent where required.</p>

      <h2 className="text-xl font-semibold mt-6">7. Updates</h2>
      <p>We may update this Cookie Policy as our use of third-party services changes. We will notify you of material changes within the Service.</p>

      <h2 className="text-xl font-semibold mt-6">8. Contact</h2>
      <p>For questions about cookies, contact us at vicvianfeed@gmail.com.</p>
    </LegalPage>
  );
}