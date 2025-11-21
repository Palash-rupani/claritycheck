import Header from '@/src/components/Header'
import Footer from '@/src/components/Footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Zap, Brain } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-20 sm:py-32">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-8 text-center">
              <h1 className="text-4xl font-bold text-balance sm:text-5xl lg:text-6xl text-foreground">
                Build Trust Through
                <span className="block text-primary">Product Transparency</span>
              </h1>
              <p className="text-lg text-muted-foreground text-balance sm:text-xl">
                Get AI-powered insights into your supply chain and make confident product claims with ClarityCheck.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row justify-center pt-4">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                  <Link href="/products/new">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/about">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
              <p className="mt-4 text-muted-foreground">
                Three simple steps to product clarity
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  icon: <CheckCircle className="h-8 w-8 text-primary" />,
                  title: 'Add Your Product',
                  description: 'Tell us about your product, its claims, and key ingredients.',
                },
                {
                  icon: <Brain className="h-8 w-8 text-primary" />,
                  title: 'Get AI Questions',
                  description: 'Our AI generates smart follow-up questions to verify your claims.',
                },
                {
                  icon: <Zap className="h-8 w-8 text-primary" />,
                  title: 'Generate Report',
                  description: 'Receive a comprehensive transparency report to share with customers.',
                },
              ].map((step, idx) => (
                <div key={idx} className="rounded-2xl border border-border bg-card p-8 text-center">
                  <div className="flex justify-center mb-4">{step.icon}</div>
                  <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Values */}
        <section className="bg-primary/5 py-20 sm:py-32">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">Our Mission</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Health', desc: 'Products that nourish and support wellbeing' },
                { title: 'Wisdom', desc: 'Evidence-based information and transparency' },
                { title: 'Virtue', desc: 'Ethical practices throughout supply chains' },
              ].map((value, idx) => (
                <div key={idx} className="space-y-2">
                  <h3 className="font-bold text-lg text-foreground">{value.title}</h3>
                  <p className="text-muted-foreground">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
