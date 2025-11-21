import Header from '@/src/components/Header'
import Footer from '@/src/components/Footer'
import { Lightbulb, Code, Users, Brain } from 'lucide-react'

export const metadata = {
  title: 'About ClarityCheck',
  description: 'Learn about our mission to bring transparency to product supply chains',
}

export default function About() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary/5 py-20 sm:py-32">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-foreground sm:text-5xl text-balance">
              About ClarityCheck
            </h1>
            <p className="mt-6 text-lg text-muted-foreground text-balance">
              We believe consumers deserve to know the truth about the products they buy. ClarityCheck makes it easy for brands to build supply chain transparency and back up their claims with evidence.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 sm:py-32">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                To empower brands and suppliers with tools that foster genuine transparency, enabling evidence-based claims and building lasting consumer trust. We connect product promises with supply chain reality through AI-powered insights and human-centered design.
              </p>
            </div>

            {/* Core Values */}
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-8">Core Values</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    title: 'Health',
                    description: 'Products that truly nourish and support human wellbeing, with full transparency about ingredients and sourcing.',
                    icon: <Lightbulb className="h-8 w-8" />,
                  },
                  {
                    title: 'Wisdom',
                    description: 'Evidence-based information over marketing claims. We use AI to ask the right questions and surface the right data.',
                    icon: <Brain className="h-8 w-8" />,
                  },
                  {
                    title: 'Virtue',
                    description: 'Ethical practices throughout supply chains. Transparency that leads to better choices for people and planet.',
                    icon: <Users className="h-8 w-8" />,
                  },
                ].map((value, idx) => (
                  <div key={idx} className="rounded-2xl border border-border bg-card p-8">
                    <div className="text-primary mb-4">{value.icon}</div>
                    <h4 className="text-lg font-bold text-foreground mb-2">{value.title}</h4>
                    <p className="text-muted-foreground">{value.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Technology */}
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">Technology</h3>
              <div className="bg-card rounded-2xl border border-border p-8 space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">AI-Powered Questions</h4>
                  <p className="text-muted-foreground">
                    Our AI model analyzes product claims and automatically generates relevant follow-up questions to suppliers, uncovering gaps in transparency and verifying assertions.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Smart Analysis</h4>
                  <p className="text-muted-foreground">
                    Pattern recognition helps identify common issues in supply chains and highlights opportunities for improvement across products.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Modern Stack</h4>
                  <p className="text-muted-foreground">
                    Built with Next.js, TypeScript, and hosted on Vercel for reliability and performance. Integrates with leading e-commerce and supply chain platforms.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Notes */}
            <div className="bg-accent/10 rounded-2xl border border-accent/20 p-8">
              <div className="flex gap-3 mb-4">
                <Code className="h-6 w-6 text-primary flex-shrink-0" />
                <h3 className="text-lg font-bold text-foreground">AI Model Information</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                ClarityCheck uses advanced language models to generate contextually relevant follow-up questions. The AI considers product category, claims made, and supply chain complexity to suggest the most impactful questions.
              </p>
              <p className="text-sm text-muted-foreground">
                Configuration note: Models can be changed via the backend API. Default uses OpenAI GPT-4 but supports Anthropic Claude, Google Vertex, and other providers through the AI SDK.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
