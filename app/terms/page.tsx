import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Terms of Service - Invyra',
  description: 'Invyra Terms of Service',
}

export default function TermsPage() {
  return (
    <LegalPage
      legalKey="terms"
      title="Invyra Terms of Service"
      subtitle="These Terms govern your access to and use of Invyra, including our platform, website, applications, and services."
      effectiveDate="Effective Date: May 7, 2026"
      contactEmail="support@invyra.app"
      overview="Welcome to Invyra. By using Invyra, you agree to these Terms. If you do not agree with these Terms, you may not use the Service."
      sidebarTitle="At a glance"
      sidebarItems={[
        'Minimum age: 13+',
        'You own your content, with a limited license granted to operate the Service',
        'AI output should always be reviewed before publishing or sending',
        'Subscriptions, service availability, and pricing may change with notice',
      ]}
      sections={[
        {
          title: '1. About Invyra',
          paragraphs: [
            'Invyra is a platform that allows users to create, customize, manage, and share digital invitations and event experiences, including AI-assisted design tools, RSVP management, guest communication tools, and event analytics.',
          ],
        },
        {
          title: '2. Eligibility',
          paragraphs: [
            'You must be at least 13 years old to use Invyra.',
            'If you are under the age required in your jurisdiction to enter into legal agreements, you may only use Invyra with permission from a parent or legal guardian.',
          ],
          bullets: [
            'You are legally permitted to use the Service',
            'The information you provide is accurate',
            'You will comply with all applicable laws',
          ],
        },
        {
          title: '3. User Accounts',
          paragraphs: [
            'To access certain features, you may need to create an account.',
            'You are responsible for maintaining the confidentiality of your account credentials, all activities occurring under your account, and providing accurate and current information.',
            'Invyra reserves the right to suspend or terminate accounts that violate these Terms.',
          ],
        },
        {
          title: '4. User Content',
          paragraphs: [
            'You retain ownership of the invitations, designs, text, images, branding assets, guest information, and other content you create or upload ("User Content").',
            'By uploading or creating content on Invyra, you grant Invyra a limited, non-exclusive license to store, process, display, transmit, and render your content solely for the purpose of operating and improving the Service.',
          ],
          bullets: [
            'You own or have permission to use your content',
            'Your content does not infringe on third-party rights',
            'Your content does not violate laws or contain harmful material',
          ],
        },
        {
          title: '5. AI-Generated Content',
          paragraphs: [
            'Invyra may provide AI-generated suggestions, layouts, text, animations, or design modifications.',
            'AI-generated output may not always be accurate or appropriate. You are responsible for reviewing and approving generated content. Invyra does not guarantee originality or suitability of AI-generated content.',
            'Users maintain ownership of final approved invitation designs created using the platform.',
          ],
        },
        {
          title: '6. Acceptable Use',
          bullets: [
            'Use the Service for unlawful purposes',
            'Upload malicious code or harmful content',
            'Attempt unauthorized access to systems or accounts',
            'Abuse messaging or reminder systems',
            'Send spam invitations or fraudulent communications',
            'Infringe intellectual property rights',
            'Use Invyra to harass, threaten, or harm others',
          ],
          paragraphs: ['Invyra may remove content or suspend accounts that violate these rules.'],
        },
        {
          title: '7. Guest Data & Communications',
          paragraphs: [
            'If you upload guest contact information, you represent that you have the legal right to use and share that information.',
            'Invyra is not responsible for user-generated communications sent through the platform.',
          ],
          bullets: [
            'Obtaining consent where required',
            'Complying with email/SMS communication laws',
            'Ensuring communications are lawful',
          ],
        },
        {
          title: '8. Intellectual Property',
          paragraphs: [
            'The Invyra platform, including branding, software, interface designs, graphics, and platform functionality, is owned by Invyra and protected by intellectual property laws.',
          ],
          bullets: [
            'Copy or redistribute the platform',
            'Reverse engineer the Service',
            'Use Invyra branding without permission',
          ],
        },
        {
          title: '9. Payments & Subscriptions',
          paragraphs: [
            'Certain features may require payment or subscription plans.',
            'If applicable, pricing will be displayed before purchase, subscriptions may renew automatically unless canceled, and refund policies will be described at purchase. Invyra reserves the right to modify pricing with reasonable notice.',
          ],
        },
        {
          title: '10. Service Availability',
          paragraphs: [
            'We strive to provide reliable access to Invyra but do not guarantee uninterrupted service.',
            'The Service may occasionally experience downtime, maintenance, feature changes, or performance interruptions. Invyra may modify or discontinue features at any time.',
          ],
        },
        {
          title: '11. Limitation of Liability',
          paragraphs: [
            'To the maximum extent permitted by law, Invyra and its affiliates shall not be liable for indirect or consequential damages, loss of data, lost profits, event disruptions, or unauthorized access to user accounts.',
            'Your use of the Service is at your own risk.',
          ],
        },
        {
          title: '12. Disclaimer of Warranties',
          paragraphs: [
            'The Service is provided "as is" and "as available" without warranties of any kind.',
          ],
          bullets: [
            'Error-free operation',
            'AI accuracy',
            'Continuous availability',
            'Compatibility with all devices',
          ],
        },
        {
          title: '13. Termination',
          paragraphs: [
            'You may stop using Invyra at any time.',
            'Invyra may suspend or terminate access if these Terms are violated, fraudulent or abusive behavior is detected, or required by law.',
          ],
        },
        {
          title: '14. Privacy',
          paragraphs: [
            'Your use of Invyra is also governed by the Privacy Policy below.',
          ],
        },
        {
          title: '15. Changes to These Terms',
          paragraphs: [
            'Invyra may update these Terms periodically. Continued use of the Service after changes become effective constitutes acceptance of the updated Terms.',
          ],
        },
        {
          title: '16. Contact',
          paragraphs: [
            'For questions regarding these Terms, email support@invyra.app.',
          ],
        },
      ]}
    />
  )
}