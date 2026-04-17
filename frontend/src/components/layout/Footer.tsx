import { Link } from "react-router-dom";
import {
  Phone, Mail, MapPin, Facebook, Instagram, Twitter,
  ExternalLink,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const currentYear = new Date().getFullYear();

const footerLinks = {
  shop: [
    { label: "Home",      to: "/" },
    { label: "Products",   to: "/products" },
    { label: "Orders",     to: "/orders" },
    { label: "Cart",       to: "/cart" },
    { label: "Articles", to: "/articles" },
  ],
  support: [
    { label: "Chat with Pharmacist", to: "/chat" },
    { label: "AI Assistant",         to: "/ai-chat" },
    { label: "My Profile",           to: "/profile" },
  ],
  company: [
    { label: "About Us",        to: "/about" },
    { label: "FAQ",             to: "/faq" },
    { label: "Privacy Policy",  to: "/privacy" },
    { label: "Terms of Use",    to: "/terms" },
  ],
};

const socialLinks = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: Facebook,
    color: "hover:text-blue-600",
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: Instagram,
    color: "hover:text-pink-500",
  },
  {
    label: "Twitter",
    href: "https://twitter.com",
    icon: Twitter,
    color: "hover:text-sky-500",
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">

        {/* Top section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="flex items-center gap-2.5 w-fit">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-sm">
                  SLM
                </span>
              </div>
              <span className="font-display font-semibold text-xl">
                Shwe La Min
              </span>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Myanmar's trusted online pharmacy. Quality medicines, expert
              pharmacist advice, and fast delivery — all in one place.
            </p>

            {/* Social links - FIXED: Added back the <a> tag */}
            <div className="flex items-center gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className={`h-9 w-9 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground transition-colors ${s.color}`}
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>

            {/* Contact info - FIXED: Added back the <a> tags */}
            <div className="space-y-2.5">
              <a
                href="tel:+9509123456789"
                className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                </div>
                +95 09988670772
              </a>
              
              <a
                href="mailto:hello@shwelamiin.com"
                className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                </div>
                hello@shwelamin.com
              </a>

              <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                </div>
                <a
                  href="https://maps.app.goo.gl/wk4cVQXbH5diMJ819"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  No. 22, Pareik Khayar St,<br />Myanaung, Myanmar
                </a>
              </div>
            </div>
          </div>

          {/* Shop links */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-foreground uppercase tracking-widest">
              Shop
            </p>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-foreground uppercase tracking-widest">
              Support
            </p>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-foreground uppercase tracking-widest">
              Company
            </p>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                  >
                    {link.label}
                    {(link.label === "Privacy Policy" || link.label === "Terms of Use") && (
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Opening hours */}
            <div className="pt-4 space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-widest">
                Hours
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Mon – Fri</span>
                  <span className="text-foreground font-medium">8am – 9pm</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Sat – Sun</span>
                  <span className="text-foreground font-medium">9am – 7pm</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © {currentYear} Shwe La Min Pharmacy. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <div className="h-3 w-px bg-border" />
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Terms of Use
            </Link>
            <div className="h-3 w-px bg-border" />
            <Link to="/faq" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}