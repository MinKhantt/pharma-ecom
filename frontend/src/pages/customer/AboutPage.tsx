import { Link } from "react-router-dom";
import { Shield, Truck, HeartPulse, Award, Users, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: Shield,
    title: "Quality Assured",
    description:
      "Every medicine we stock is sourced from licensed manufacturers and verified for authenticity.",
  },
  {
    icon: HeartPulse,
    title: "Patient First",
    description:
      "We prioritize your health above all. Our pharmacists provide honest, evidence-based advice.",
  },
  {
    icon: Truck,
    title: "Reliable Delivery",
    description:
      "Fast and careful delivery to your doorstep across Myanmar, with proper cold-chain handling.",
  },
  {
    icon: Award,
    title: "Licensed & Trusted",
    description:
      "Fully licensed by the Myanmar Food and Drug Administration with years of trusted service.",
  },
  {
    icon: Users,
    title: "Expert Team",
    description:
      "Our team of qualified pharmacists is available to answer your questions every day.",
  },
  {
    icon: Pill,
    title: "Wide Selection",
    description:
      "Over 500 medicines and health products covering all major therapeutic categories.",
  },
];

const stats = [
  { value: "500+",  label: "Products" },
  { value: "10K+",  label: "Customers" },
  { value: "50K+",  label: "Orders Fulfilled" },
  { value: "5★",    label: "Customer Rating" },
];

export default function AboutPage() {
  return (
    <div className="space-y-20 pb-12">

      {/* Hero */}
      <section className="text-center space-y-6 pt-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
          <HeartPulse className="h-4 w-4" />
          Myanmar's Trusted Online Pharmacy
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl mx-auto leading-tight">
          Your health is our
          <span className="text-primary"> top priority</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
          Shwe La Min Pharmacy was founded with a simple mission — to make
          quality medicines and expert pharmacist advice accessible to everyone
          across Myanmar.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button asChild size="lg">
            <Link to="/products">Browse Products</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/chat">Talk to a Pharmacist</Link>
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="text-center p-6 rounded-2xl bg-card border border-border"
          >
            <p className="font-display text-3xl font-bold text-primary">
              {stat.value}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Story */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-5">
          <h2 className="font-display text-3xl font-bold">Our Story</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Shwe La Min Pharmacy was established in Yangon with a vision to
              bridge the gap between patients and quality healthcare. We noticed
              that many people struggled to access genuine medicines and reliable
              health advice — especially outside major cities.
            </p>
            <p>
              We built this platform to change that. By combining a carefully
              curated medicine inventory with real pharmacist support, we help
              customers make informed decisions about their health — from the
              comfort of their homes.
            </p>
            <p>
              Today, we serve thousands of customers across Myanmar, fulfilling
              tens of thousands of orders with the same commitment to quality
              and care that we started with.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="h-40 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Pill className="h-16 w-16 text-primary/40" />
            </div>
            <div className="h-28 rounded-2xl bg-muted" />
          </div>
          <div className="space-y-4 pt-6">
            <div className="h-28 rounded-2xl bg-muted" />
            <div className="h-40 rounded-2xl bg-primary/5 flex items-center justify-center">
              <HeartPulse className="h-16 w-16 text-primary/30" />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="font-display text-3xl font-bold">Our Values</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Everything we do is guided by these core principles.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {values.map((v) => (
            <div
              key={v.title}
              className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all space-y-3"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <v.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {v.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center p-10 rounded-3xl bg-primary/5 border border-primary/10 space-y-5">
        <h2 className="font-display text-3xl font-bold">
          Ready to get started?
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Browse our full range of medicines or speak directly with one of our
          qualified pharmacists.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button asChild size="lg">
            <Link to="/products">Shop Now</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/chat">Chat with Us</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}