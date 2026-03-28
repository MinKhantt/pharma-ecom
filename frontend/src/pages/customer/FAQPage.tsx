import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const faqs = [
  {
    category: "Orders & Delivery",
    items: [
      {
        q: "How do I place an order?",
        a: "Browse our products, add items to your cart, then proceed to checkout. You'll need to create an account or log in, provide a delivery address, and choose your payment method.",
      },
      {
        q: "How long does delivery take?",
        a: "Standard delivery typically takes 1–3 business days within Yangon and 3–7 business days for other regions across Myanmar.",
      },
      {
        q: "Can I track my order?",
        a: "Yes. Once your order is shipped, you can view the status on your Orders page. You'll see real-time updates as it moves from processing to delivered.",
      },
      {
        q: "Can I cancel my order?",
        a: "You can cancel orders that are in Pending, Confirmed, or Processing status. Once an order is Ready for Pickup or Shipped, it cannot be cancelled.",
      },
      {
        q: "What if my order arrives damaged?",
        a: "If your order arrives damaged or incorrect, you can request a return from the Order Detail page within a reasonable time of delivery. We'll review your request and issue a refund if approved.",
      },
    ],
  },
  {
    category: "Prescriptions",
    items: [
      {
        q: "Which medicines require a prescription?",
        a: "Prescription-only medicines are clearly marked with an orange 'Rx' badge on the product page. You'll be asked to upload a valid prescription after checkout.",
      },
      {
        q: "How do I upload a prescription?",
        a: "After placing an order containing Rx items, go to your Order Detail page and tap 'Upload Prescription'. We accept JPEG, PNG, WebP, and PDF files up to 5MB.",
      },
      {
        q: "What happens after I upload my prescription?",
        a: "Our pharmacist will review it and confirm or reject the order. You'll see the status update on your order page.",
      },
      {
        q: "Is my prescription kept confidential?",
        a: "Yes. Your prescription documents are stored securely and only reviewed by licensed pharmacists. We never share your health information with third parties.",
      },
    ],
  },
  {
    category: "Payments & Refunds",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept Credit Card, Debit Card, and Cash on Delivery.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes. Card details are encrypted and processed securely. We do not store your full card information on our servers.",
      },
      {
        q: "How do I get a refund?",
        a: "You can request a return from the Order Detail page once your order is marked as Delivered. Go to the order, click 'Request Return', select a reason, and submit. Our team will review and process your refund within 3–5 business days.",
      },
    ],
  },
  {
    category: "Account & Profile",
    items: [
      {
        q: "How do I create an account?",
        a: "Click Register on the login page and fill in your name, email, and password. You can also sign up instantly with your Google account.",
      },
      {
        q: "Can I update my delivery address?",
        a: "Yes. Go to your Profile page to update your default delivery address, phone number, and other personal details.",
      },
      {
        q: "I forgot my password. What should I do?",
        a: "On the login page, use the 'Forgot password' option to reset it via email. Alternatively, log in with Google if your account is linked.",
      },
    ],
  },
  {
    category: "Pharmacist Support",
    items: [
      {
        q: "Can I speak to a pharmacist?",
        a: "Yes. Use the Chat page to send a message directly to one of our licensed pharmacists. We're available daily from 8am to 9pm.",
      },
      {
        q: "What is the AI Assistant?",
        a: "Our AI Assistant can answer general medicine questions instantly — side effects, dosage guidance, drug interactions, and more. For serious medical concerns, always consult a real pharmacist or doctor.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-medium">{q}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 pt-0">
          <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [search, setSearch] = useState("");

  const filtered = faqs
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-12">
      {/* Header */}
      <div className="text-center space-y-4 pt-8">
        <h1 className="font-display text-4xl font-bold">
          Frequently Asked Questions
        </h1>
        <p className="text-muted-foreground">
          Find answers to the most common questions about Shwe La Min Pharmacy.
        </p>
        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* FAQ sections */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No results found for "{search}".
          </p>
        </div>
      ) : (
        filtered.map((section) => (
          <div key={section.category} className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-primary">
              {section.category}
            </h2>
            <div className="space-y-2">
              {section.items.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Still need help */}
      <div className="text-center p-8 rounded-2xl bg-muted/50 border border-border space-y-4">
        <h3 className="font-display text-xl font-semibold">
          Still have questions?
        </h3>
        <p className="text-sm text-muted-foreground">
          Our pharmacists are happy to help with anything not covered here.
        </p>
        <Button asChild>
          <Link to="/chat">Chat with a Pharmacist</Link>
        </Button>
      </div>
    </div>
  );
}