import { ScrollText } from "lucide-react";

const sections = [
  {
    title: "Acceptance of Terms",
    content:
      "By accessing or using Shwe La Min Pharmacy's platform, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our services. These terms apply to all visitors, customers, and users of the platform.",
  },
  {
    title: "Eligibility",
    content:
      "You must be at least 18 years of age to create an account and place orders. By using our services, you confirm that you are of legal age and have the legal capacity to enter into a binding agreement. We reserve the right to refuse service to anyone for any reason.",
  },
  {
    title: "Account Responsibilities",
    content:
      "You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate, current, and complete information during registration and to keep your profile up to date. You are responsible for all activities that occur under your account. Notify us immediately of any unauthorized use of your account.",
  },
  {
    title: "Ordering & Payments",
    content:
      "All orders are subject to availability and confirmation. Prices are displayed in Myanmar Kyat (MMK) and are subject to change. We reserve the right to refuse or cancel any order at our discretion. Payment is processed at the time of order placement. Cash on Delivery orders are confirmed upon delivery.",
  },
  {
    title: "Prescription Medicines",
    content:
      "Prescription-only medicines (marked Rx) require a valid prescription issued by a licensed Myanmar healthcare provider. You must upload a clear, legible prescription before your order can be processed. Providing a fraudulent or invalid prescription is a serious offense and may result in account termination and referral to relevant authorities.",
  },
  {
    title: "Returns & Refunds",
    content:
      "Returns may be requested for delivered orders that are damaged, incorrect, or unsatisfactory. Return requests must be submitted through the Order Detail page. Refunds are processed within 3–5 business days upon approval. Prescription medicines and opened products are generally non-returnable unless defective.",
  },
  {
    title: "Health Disclaimer",
    content:
      "The information provided on our platform, including pharmacist chat and AI Assistant responses, is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare provider for medical diagnoses and treatment decisions. Do not delay seeking medical attention based on information provided through our platform.",
  },
  {
    title: "Intellectual Property",
    content:
      "All content on this platform — including text, graphics, logos, and software — is the property of Shwe La Min Pharmacy and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our prior written consent.",
  },
  {
    title: "Limitation of Liability",
    content:
      "To the fullest extent permitted by law, Shwe La Min Pharmacy shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services. Our total liability for any claim shall not exceed the amount you paid for the relevant order.",
  },
  {
    title: "Termination",
    content:
      "We reserve the right to suspend or terminate your account at any time for violations of these terms, fraudulent activity, or any behavior we deem harmful to our platform or other users. You may also delete your account at any time by contacting us.",
  },
  {
    title: "Governing Law",
    content:
      "These Terms of Use are governed by the laws of the Republic of the Union of Myanmar. Any disputes arising from these terms shall be subject to the jurisdiction of Myanmar courts.",
  },
  {
    title: "Changes to Terms",
    content:
      "We may update these Terms of Use from time to time. We will notify you of material changes via email or a prominent notice on our platform. Your continued use of our services after such changes constitutes your acceptance of the updated terms.",
  },
];

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-12">
      {/* Header */}
      <div className="space-y-4 pt-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ScrollText className="h-5 w-5 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold">Terms of Use</h1>
        </div>
        <p className="text-muted-foreground">Last updated: March 2026</p>
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-sm text-muted-foreground leading-relaxed">
          Please read these Terms of Use carefully before using the Shwe La Min
          Pharmacy platform. These terms govern your use of our website and
          services.
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section, i) => (
          <div
            key={section.title}
            className="space-y-3 pb-8 border-b border-border last:border-0"
          >
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <span className="text-primary font-mono text-sm">
                {String(i + 1).padStart(2, "0")}
              </span>
              {section.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {section.content}
            </p>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-2">
        <h3 className="font-semibold">Questions about these terms?</h3>
        <p className="text-sm text-muted-foreground">
          Contact us at{" "}
          <a
            href="mailto:legal@shwelamiiin.com"
            className="text-primary hover:underline"
          >
            legal@shwelamiiin.com
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