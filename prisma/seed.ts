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

