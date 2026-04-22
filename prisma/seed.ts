import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Consumer Referral Drip
  const referralCampaign = await prisma.campaign.create({
    data: {
      name: 'Consumer Referral Drip',
      description: 'Automated referral requests for consumers',
      category: 'CONSUMER',
      type: 'REFERRAL_DRIP',
      isActive: true,
      steps: {
        create: [
          {
            stepOrder: 0,
            triggerDays: 7,
            channel: 'EMAIL',
            subject: 'Thank you for enrolling!',
            content: 'Thank you for enrolling. Do you know someone who could benefit from our services? Share this referral link: [REFERRAL_LINK]',
          },
          {
            stepOrder: 1,
            triggerDays: 7,
            channel: 'SMS',
            subject: 'Referral Reminder',
            content: 'Hi! Do you know someone who could benefit? Share: [REFERRAL_LINK]',
          },
          {
            stepOrder: 2,
            triggerDays: 90,
            channel: 'EMAIL',
            subject: 'How are you enjoying your coverage?',
            content: 'We hope you\'re happy with your coverage. Know someone who needs help? [REFERRAL_LINK]',
          },
          {
            stepOrder: 3,
            triggerDays: 180,
            channel: 'EMAIL',
            subject: 'Referral Bonus Reminder',
            content: 'Refer a friend and get a bonus! [REFERRAL_LINK]',
          },
          {
            stepOrder: 4,
            triggerDays: -30, // 30 days before renewal
            channel: 'EMAIL',
            subject: 'Renewal Coming Up - Share with Friends!',
            content: 'Your renewal is coming up soon. Know someone who could benefit? [REFERRAL_LINK]',
          },
        ],
      },
    },
  })
  console.log('✅ Created Consumer Referral Drip campaign')

  // 2. Consumer Renewal Reminders
  const renewalCampaign = await prisma.campaign.create({
    data: {
      name: 'Consumer Renewal Reminders',
      description: 'Renewal reminders for active consumers',
      category: 'CONSUMER',
      type: 'RENEWAL',
      isActive: true,
      steps: {
        create: [
          {
            stepOrder: 0,
            triggerDays: -60, // 60 days before renewal
            channel: 'EMAIL',
            subject: 'Your Renewal is Coming Up',
            content: 'Hi [FIRST_NAME], your plan renewal is coming up in 60 days. We want to make sure you\'re ready. [RENEWAL_DATE]',
          },
          {
            stepOrder: 1,
            triggerDays: -30,
            channel: 'EMAIL',
            subject: 'Renewal Reminder - 30 Days',
            content: 'Your renewal is in 30 days. Please review your plan and let us know if you have questions. [RENEWAL_DATE]',
          },
          {
            stepOrder: 2,
            triggerDays: -7,
            channel: 'SMS',
            subject: 'Renewal in 7 Days',
            content: 'Your plan renews in 7 days. Reply if you need help. [RENEWAL_DATE]',
          },
        ],
      },
    },
  })
  console.log('✅ Created Consumer Renewal Reminders campaign')

  // 3. Consumer Seasonal Benefit Reminders
  const seasonalCampaign = await prisma.campaign.create({
    data: {
      name: 'Consumer Seasonal Benefit Reminders',
      description: 'Seasonal reminders about benefits',
      category: 'CONSUMER',
      type: 'NURTURE',
      isActive: true,
      steps: {
        create: [
          {
            stepOrder: 0,
            triggerDays: 0,
            channel: 'EMAIL',
            subject: 'Don\'t Forget Your Annual Benefits',
            content: 'Hi [FIRST_NAME], remember to use your annual benefits before they reset. Check your portal: [PORTAL_LINK]',
          },
        ],
      },
    },
  })
  console.log('✅ Created Consumer Seasonal Benefit Reminders campaign')

  // 4. Consumer Portal Help
  const portalHelpCampaign = await prisma.campaign.create({
    data: {
      name: 'Consumer Portal Help',
      description: 'Help consumers navigate the portal',
      category: 'CONSUMER',
      type: 'PORTAL_REDIRECT',
      isActive: true,
      steps: {
        create: [
          {
            stepOrder: 0,
            triggerDays: 14, // 14 days after enrollment
            channel: 'EMAIL',
            subject: 'Need Help with Your Portal?',
            content: 'Hi [FIRST_NAME], here\'s a quick guide to using your member portal: [PORTAL_LINK]. Need help? Call [SUPPORT_PHONE]',
          },
        ],
      },
    },
  })
  console.log('✅ Created Consumer Portal Help campaign')

  // 5. Dental Office Partner Referral Partnership
  const dentalPartnerCampaign = await prisma.campaign.create({
    data: {
      name: 'Dental Office Partner Referral Partnership',
      description: 'Referral partnership emails for dental offices',
      category: 'DENTAL_OFFICE_PARTNER',
      type: 'NURTURE',
      isActive: true,
      steps: {
        create: [
          {
            stepOrder: 0,
            triggerDays: 0,
            channel: 'EMAIL',
            subject: 'Partner Referral Program',
            content: 'Thank you for being a partner! Share our services with your patients. Referral benefits: [REFERRAL_LINK]',
          },
          {
            stepOrder: 1,
            triggerDays: 30,
            channel: 'EMAIL',
            subject: 'Benefits Day Scheduling',
            content: 'Schedule a benefits day at your office. Let\'s help your patients understand their coverage. Reply to schedule.',
          },
        ],
      },
    },
  })
  console.log('✅ Created Dental Office Partner campaign')

  // 6. Health Office Partner Partnership
  const healthPartnerCampaign = await prisma.campaign.create({
    data: {
      name: 'Health Office Partner Partnership',
      description: 'Partnership emails for health offices',
      category: 'HEALTH_OFFICE_PARTNER',
      type: 'NURTURE',
      isActive: true,
      steps: {
        create: [
          {
            stepOrder: 0,
            triggerDays: 0,
            channel: 'EMAIL',
            subject: 'Welcome Health Office Partner',
            content: 'Thank you for partnering with us! Let\'s work together to serve your patients. [REFERRAL_LINK]',
          },
          {
            stepOrder: 1,
            triggerDays: 45,
            channel: 'EMAIL',
            subject: 'Patient Education Day Invitation',
            content: 'Would you like to host a patient education day? We can help your patients understand their benefits. Reply to schedule.',
          },
        ],
      },
    },
  })
  console.log('✅ Created Health Office Partner campaign')

  // 7. Other Business Partner Employee Coverage
  const businessPartnerCampaign = await prisma.campaign.create({
    data: {
      name: 'Other Business Partner Employee Coverage',
      description: 'Employee coverage strategy for business partners',
      category: 'OTHER_BUSINESS_PARTNER',
      type: 'NURTURE',
      isActive: true,
      steps: {
        create: [
          {
            stepOrder: 0,
            triggerDays: 0,
            channel: 'EMAIL',
            subject: 'Employee Coverage Strategy',
            content: 'Let\'s discuss how we can help provide coverage for your employees. Benefits include: [REFERRAL_LINK]',
          },
          {
            stepOrder: 1,
            triggerDays: 30,
            channel: 'EMAIL',
            subject: 'Referral Incentives for Your Team',
            content: 'Your employees can refer others and earn incentives. Share this: [REFERRAL_LINK]',
          },
        ],
      },
    },
  })
  console.log('✅ Created Other Business Partner campaign')

  // 8. Prospect Nurture Sequence
  const prospectCampaign = await prisma.campaign.create({
    data: {
      name: 'Prospect Nurture Sequence',
      description: 'Nurture prospects toward appointment booking',
      category: 'PROSPECT',
      type: 'NURTURE',
      isActive: true,
      steps: {
        create: [
          {
            stepOrder: 0,
            triggerDays: 0,
            channel: 'EMAIL',
            subject: 'Welcome! Let\'s Get Started',
            content: 'Hi [FIRST_NAME], thanks for your interest! Schedule an appointment to learn more: [APPOINTMENT_LINK]',
          },
          {
            stepOrder: 1,
            triggerDays: 3,
            channel: 'SMS',
            subject: 'Still Interested?',
            content: 'Hi [FIRST_NAME], we\'d love to help you find the right coverage. Schedule here: [APPOINTMENT_LINK]',
          },
          {
            stepOrder: 2,
            triggerDays: 7,
            channel: 'EMAIL',
            subject: 'Benefits You Could Be Missing',
            content: 'Don\'t miss out on great coverage. Schedule a free consultation: [APPOINTMENT_LINK]',
          },
          {
            stepOrder: 3,
            triggerDays: 14,
            channel: 'EMAIL',
            subject: 'Last Chance - Special Offer',
            content: 'We have a special offer for new clients. Schedule before it expires: [APPOINTMENT_LINK]',
          },
        ],
      },
    },
  })
  console.log('✅ Created Prospect Nurture Sequence campaign')

  // --- JotForm-driven sequences (names referenced by lib/jotform-form-routing.ts & env form IDs) ---
  const jotformCampaigns = [
    {
      name: 'Dental Partner Lead Sequence',
      category: 'DENTAL_OFFICE_PARTNER' as const,
      description: 'Email sequence when dental office partner form is submitted',
      steps: [
        {
          stepOrder: 0,
          triggerDays: 0,
          channel: 'EMAIL' as const,
          subject: 'Welcome — dental partner next steps',
          content:
            'Thank you for connecting with us as a dental office partner. We will follow up shortly with materials and scheduling. Questions? Reply to this email.',
        },
        {
          stepOrder: 1,
          triggerDays: 7,
          channel: 'EMAIL' as const,
          subject: 'Partner resources & patient education',
          content:
            'Here are resources you can share with patients. If you would like a benefits day at your office, reply with preferred dates.',
        },
      ],
    },
    {
      name: 'Clinic Partner Lead Sequence',
      category: 'HEALTH_OFFICE_PARTNER' as const,
      description: 'Email sequence when clinic / health office form is submitted',
      steps: [
        {
          stepOrder: 0,
          triggerDays: 0,
          channel: 'EMAIL' as const,
          subject: 'Welcome — clinic partner next steps',
          content:
            'Thank you for your interest as a clinic partner. Our team will reach out with onboarding details.',
        },
        {
          stepOrder: 1,
          triggerDays: 5,
          channel: 'EMAIL' as const,
          subject: 'Scheduling a quick partner call',
          content: 'We would love a brief call to align on how we support your patients. Reply with a good time this week.',
        },
      ],
    },
    {
      name: 'Individual Welcome Nurture',
      category: 'CONSUMER' as const,
      description: 'Welcome / nurture for personal or client intake JotForm',
      steps: [
        {
          stepOrder: 0,
          triggerDays: 0,
          channel: 'EMAIL' as const,
          subject: 'Thanks — we received your information',
          content:
            'Hi [FIRST_NAME], thank you for reaching out. A licensed advisor will review your details and follow up. If you need anything sooner, call [SUPPORT_PHONE].',
        },
        {
          stepOrder: 1,
          triggerDays: 3,
          channel: 'EMAIL' as const,
          subject: 'Your coverage options (next steps)',
          content:
            'Hi [FIRST_NAME], here is a quick overview of next steps. Schedule time with us: [APPOINTMENT_LINK]',
        },
        {
          stepOrder: 2,
          triggerDays: 10,
          channel: 'SMS' as const,
          subject: 'Still here to help',
          content:
            'Hi [FIRST_NAME], want a quick call about your options? Reply YES and we will reach out.',
        },
      ],
    },
    {
      name: 'Active Client Referral Appreciation',
      category: 'CONSUMER' as const,
      description:
        'Second-stage referral touchpoints after individual becomes ACTIVE_CLIENT. Edit [REFERRAL_APPRECIATION_COPY] under CRM settings for compliance language.',
      steps: [
        {
          stepOrder: 0,
          triggerDays: 7,
          channel: 'EMAIL' as const,
          subject: 'Thank you for being a client — share the love?',
          content:
            'Hi [FIRST_NAME], we appreciate you. [REFERRAL_APPRECIATION_COPY]\n\nIf you know someone who could use help with coverage, share your link: [REFERRAL_LINK]',
        },
        {
          stepOrder: 1,
          triggerDays: 45,
          channel: 'EMAIL' as const,
          subject: 'Referral reminder (optional)',
          content:
            'Hi [FIRST_NAME], a quick note: [REFERRAL_APPRECIATION_COPY]\n\nYour personal referral link: [REFERRAL_LINK]',
        },
      ],
    },
  ]

  for (const jc of jotformCampaigns) {
    const exists = await prisma.campaign.findFirst({ where: { name: jc.name } })
    if (exists) continue
    await prisma.campaign.create({
      data: {
        name: jc.name,
        description: jc.description,
        category: jc.category,
        type: 'NURTURE',
        isActive: true,
        steps: {
          create: jc.steps,
        },
      },
    })
    console.log('✅ Created campaign:', jc.name)
  }

  console.log('✅ Seeding completed! All campaigns created.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

