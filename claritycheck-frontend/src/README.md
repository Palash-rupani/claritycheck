# ClarityCheck - Product Transparency Platform

A modern Next.js application for verifying product claims and generating transparency reports using AI-powered supplier insights.

## Quick Start

### Prerequisites

- Node.js 18+
- Backend running at `http://localhost:8000`

### Setup

\`\`\`bash
# Install dependencies (automatically inferred by Next.js runtime)
npm install

# Set environment variables
# Create .env.local or configure via Vercel dashboard:
NEXT_PUBLIC_API_BASE=http://localhost:8000
\`\`\`

### Running the App

\`\`\`bash
npm run dev
\`\`\`

The app will be available at `http://localhost:3000`.

## Configuration

### API Base URL

By default, the app connects to `http://localhost:8000`. To change this:

**For development:**
\`\`\`bash
# Set environment variable
NEXT_PUBLIC_API_BASE=http://your-api-url.com
\`\`\`

**For production:**
Configure `NEXT_PUBLIC_API_BASE` in your Vercel project settings under "Environment Variables".

### AI Model Configuration

The backend controls which AI model is used. To change models:

1. Modify your backend configuration to use a different provider (OpenAI, Anthropic, Google Vertex, etc.)
2. Update the model selection in your backend's question generation service
3. The frontend will automatically use the new model

Supported providers via Vercel AI Gateway:
- OpenAI GPT-4, GPT-3.5
- Anthropic Claude
- Google Vertex AI
- AWS Bedrock
- Fireworks AI

## Architecture

### Pages

- `/` - Home page with features and mission
- `/about` - About page with technology details
- `/dashboard` - Product dashboard with filtering
- `/products/new` - Create new product (Step 1)
- `/products/[id]/edit` - Product profile (Step 2)
- `/products/[id]/followups` - AI follow-up questions (Step 3)
- `/products/[id]/report` - Transparency report with PDF download

### Key Components

- `Header` - Navigation and branding
- `Footer` - Footer with mission values
- `StepHeader` - Multi-step progress indicator
- `ProductCard` - Dashboard product preview
- `QuestionCard` - Animated question cards with answer tracking
- `ReportPreview` - Report summary with PDF download
- `FormField` - Reusable form input with tooltips and validation

### API Integration

All API calls go through `src/lib/api.ts`:

\`\`\`typescript
import {
  createProduct,
  getProduct,
  saveProfile,
  fetchLatestFollowups,
  saveAnswers,
  fetchReportUrl,
} from '@/lib/api'
\`\`\`

## Features

### Current

- ✅ Multi-step product workflow
- ✅ AI-generated follow-up questions
- ✅ Real-time validation and error handling
- ✅ Smooth animations with Framer Motion
- ✅ Responsive design for mobile and desktop
- ✅ Conditional fields based on product claims
- ✅ PDF report generation and download
- ✅ Dashboard with filtering and status tracking

### Future Ready

Comments throughout the codebase indicate where to add:

- [ ] **Authentication** - Supabase Auth or your preferred provider
- [ ] **User Roles** - Admin, Supplier, Brand dashboards
- [ ] **Supplier Sync** - Real-time updates from supplier systems
- [ ] **Scheduled Scans** - Automatic recertification checks
- [ ] **Analytics** - Tracking supply chain trends
- [ ] **Webhooks** - Integration with external systems
- [ ] **Two-Factor Auth** - Enhanced security
- [ ] **Audit Logs** - Full activity tracking

## Development

### Adding a New Page

1. Create file under `app/[route]/page.tsx`
2. Wrap with `Header` and `Footer` components
3. Use `StepHeader` for multi-step flows
4. Import types from `src/types`

### Adding API Endpoints

Update `src/lib/api.ts` with new functions:

\`\`\`typescript
export async function myNewEndpoint(id: string, data: any) {
  return fetchAPI(`/my-endpoint/${id}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
\`\`\`

## Styling

The app uses Tailwind CSS v4 with a custom design system defined in `app/globals.css`:

- **Primary**: Navy blue (`--primary`) - main brand color
- **Accent**: Green (`--accent`) - success and completion states
- **Muted**: Grays - secondary text and backgrounds
- **Destructive**: Red - errors and warnings

All colors support both light and dark modes.

## Performance

- Code splitting and lazy loading for heavy components
- Framer Motion for performant animations
- Optimized images with Next.js Image component
- Server-side rendering where possible
- Client-side caching via API responses

## Accessibility

- Semantic HTML with `<main>` and `<header>` landmarks
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators on all interactive elements
- Screen reader friendly tooltips

## Contributing

When adding features:

1. Follow the existing component structure
2. Add TypeScript types to `src/types/index.ts`
3. Use shadcn/ui components for consistency
4. Add helpful comments explaining API usage
5. Keep animations smooth and purposeful
6. Test on mobile and desktop viewports

## Support

For issues or questions:

1. Check the backend is running at `http://localhost:8000`
2. Verify environment variables are set correctly
3. Check browser console for error messages
4. Review API endpoint documentation in `src/lib/api.ts`
