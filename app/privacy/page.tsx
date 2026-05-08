import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Privacy Policy - Eventora',
  description: 'Eventora Privacy Policy',
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Eventora Privacy Policy"
      subtitle="This Privacy Policy explains how Eventora collects, uses, stores, and protects information when you use our platform."
      effectiveDate="Effective Date: May 7, 2026"
      contactEmail="support@eventora.app"
      overview="Eventora values your privacy. This policy describes the categories of information we collect, why we collect it, how we share it, and the rights you may have depending on your location."
      sidebarTitle="Privacy highlights"
      sidebarItems={[
        'We do not sell personal data',
        'AI prompts and outputs may be processed by third-party providers',
        'Guest contact information is used only for the service you request',
        'You may request access, correction, deletion, or export of your data',
      ]}
      sections={[
        {
          title: '1. Information We Collect',
          paragraphs: ['Account Information'],
          bullets: ['Name', 'Email address', 'Username', 'Profile information'],
        },
        {
          title: 'Event & Invitation Data',
          bullets: ['Invitation content', 'Uploaded images or branding assets', 'Event details', 'RSVP information', 'Guest lists'],
        },
        {
          title: 'AI Interaction Data',
          bullets: ['Prompts submitted to the AI assistant', 'AI-generated outputs', 'Feedback on generated suggestions'],
        },
        {
          title: 'Technical Information',
          bullets: ['IP address', 'Browser type', 'Device information', 'Usage analytics', 'Cookies and session information'],
        },
        {
          title: '2. How We Use Information',
          bullets: [
            'Provide and improve the Service',
            'Generate AI-powered suggestions',
            'Process invitations and RSVP systems',
            'Deliver reminders and notifications',
            'Improve performance and user experience',
            'Maintain security and prevent abuse',
            'Comply with legal obligations',
          ],
        },
        {
          title: '3. AI Processing',
          paragraphs: [
            'User content submitted to AI features may be processed by third-party AI providers for the purpose of generating responses or design suggestions.',
            'We do not use private invitation content to publicly train AI models unless explicitly stated and consented to.',
          ],
        },
        {
          title: '4. Guest Contact Information',
          paragraphs: ['Users may upload guest contact information such as names, emails, and phone numbers. This information is used solely for RSVP management, invitation delivery, and reminder notifications. Users are responsible for obtaining any legally required consent from guests.'],
        },
        {
          title: '5. Sharing of Information',
          paragraphs: ['We do not sell personal data. We may share information with service providers and infrastructure partners, analytics providers, AI processing providers, and legal authorities when required by law. We only share information necessary to operate the Service.'],
        },
        {
          title: '6. Data Retention',
          paragraphs: ['We retain information only as long as necessary to provide the Service, meet legal obligations, resolve disputes, and enforce agreements. Users may request deletion of their account and associated data.'],
        },
        {
          title: '7. Security',
          paragraphs: ['We implement reasonable safeguards to protect user data, including encryption in transit where applicable, secure authentication systems, access controls, and infrastructure monitoring. However, no system can guarantee absolute security.'],
        },
        {
          title: '8. Your Rights',
          bullets: ['Access your data', 'Correct inaccurate information', 'Delete your information', 'Export your data', 'Restrict certain processing', 'Withdraw consent'],
          paragraphs: ['To exercise these rights, contact support@eventora.app.'],
        },
        {
          title: '9. Cookies & Analytics',
          paragraphs: ['Eventora may use cookies and analytics tools to maintain sessions, improve performance, understand feature usage, and personalize experiences. Users may manage cookie settings through their browser.'],
        },
        {
          title: '10. Children\'s Privacy',
          paragraphs: ['Eventora is not intended for children under 13. We do not knowingly collect personal information from children under 13.'],
        },
        {
          title: '11. International Users',
          paragraphs: ['If you access Eventora from outside the United States, your information may be processed in countries with different data protection laws.'],
        },
        {
          title: '12. Changes to This Privacy Policy',
          paragraphs: ['We may update this Privacy Policy periodically. Continued use of Eventora after updates constitutes acceptance of the revised policy.'],
        },
        {
          title: '13. Contact Us',
          paragraphs: ['For privacy-related questions or requests, email support@eventora.app.'],
        },
      ]}
    />
  )
}