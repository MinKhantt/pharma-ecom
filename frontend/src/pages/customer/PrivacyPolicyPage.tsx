import { Shield } from "lucide-react";

const sections = [
  {
    title: "Information We Collect",
    content: [
      "Personal information you provide when creating an account: full name, email address, phone number, and date of birth.",
      "Delivery addresses you enter during checkout.",
      "Prescription documents you upload for Rx orders.",
      "Order history and payment transaction records.",
      "Profile photos you choose to upload.",
      "Messages sent through our pharmacist chat.",
    ],
  },
  {
    title: "How We Use Your Information",
    content: [
      "To process and fulfill your orders and manage deliveries.",
      "To verify prescriptions and ensure medicines are dispensed safely.",
      "To provide pharmacist consultation and AI-assisted health information.",
      "To send order updates and important notifications.",
      "To improve our platform and personalize your experience.",
      "To comply with Myanmar pharmaceutical regulations and legal obligations.",
    ],
  },
  {
    title: "How We Protect Your Information",
    content: [
      "All data is transmitted using HTTPS encryption.",
      "Passwords are hashed using industry-standard algorithms and never stored in plain text.",
      "Prescription documents are stored securely and accessible only to licensed pharmacists.",
      "Payment card details are not stored on our servers.",
      "Access to customer data is restricted to authorized personnel only.",
    ],
  },
  {
    title: "Sharing Your Information",
    content: [
      "We do not sell your personal information to third parties.",
      "We may share information with delivery partners solely for order fulfillment.",
      "We may disclose information if required by Myanmar law or regulatory authorities.",
      "Aggregated, anonymized data may be used for analytics and service improvement.",
    ],
  },
  {
    title: "Your Rights",
    content: [
      "You may access, update, or correct your personal information from your Profile page at any time.",
      "You may request deletion of your account and associated data by contacting us.",
      "You may opt out of non-essential communications at any time.",
      "You may request a copy of the personal data we hold about you.",
    ],
  },
  {
    title: "Cookies",
    content: [
      "We use session cookies to keep you logged in and maintain your cart.",
      "We do not use advertising or tracking cookies.",
      "You can disable cookies in your browser settings, though some features may not function correctly.",
    ],
  },
  {
    title: "Changes to This Policy",
    content: [
      "We may update this Privacy Policy from time to time.",
      "We will notify you of significant changes via email or a notice on the platform.",
      "Continued use of our services after changes constitutes acceptance of the updated policy.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-12">
      {/* Header */}
      <div className="space-y-4 pt-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold">Privacy Policy</h1>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Last updated: March 2026
        </p>
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-sm text-muted-foreground leading-relaxed">
          This Privacy Policy explains how Shwe La Min Pharmacy collects, uses,
          and protects your personal information when you use our platform. By
          using our services, you agree to the practices described in this
          policy.
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section, i) => (
          <div key={section.title} className="space-y-3">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <span className="text-primary font-mono text-sm">
                {String(i + 1).padStart(2, "0")}
              </span>
              {section.title}
            </h2>
            <ul className="space-y-2">
              {section.content.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/50 shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-2">
        <h3 className="font-semibold">Contact Us</h3>
        <p className="text-sm text-muted-foreground">
          For any privacy-related questions or requests, please contact us at{" "}
          <a
            href="mailto:privacy@shwelamiiin.com"
            className="text-primary hover:underline"
          >
            privacy@shwelamiiin.com
          </a>{" "}
          or through our{" "}
          <a href="/chat" className="text-primary hover:underline">
            pharmacist chat
          </a>
          .
        </p>
      </div>
    </div>
  );
}