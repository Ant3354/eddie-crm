import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest) {
  let body: any = null
  try {
    body = await request.json()
    
    // Log the incoming webhook for debugging
    console.log('📥 JotForm webhook received:', JSON.stringify(body, null, 2))
    console.log('🔍 Webhook URL:', request.url)
    console.log('🔍 Request method:', request.method)
    
    // JotForm sends data in different formats. Handle multiple structures:
    // Format 1: answers array with field IDs
    // Format 2: formData object
    // Format 3: direct properties
    // Format 4: rawRequest with form data
    
    let firstName = ''
    let lastName = ''
    let email = ''
    let phone = ''
    let address = ''
    let language = 'English'
    let interestType = 'PROSPECT'
    let appointmentTime = ''
    let notes = ''
    let source = 'JotForm'
    let referralCode = ''
    
    // Try to extract from answers array (JotForm's standard format)
    if (body.answers) {
      const answerMap: { [key: string]: any } = {}
      body.answers.forEach((ans: any) => {
        // JotForm can send answers in different formats:
        // Format 1: { name: "First Name", answer: "John" }
        // Format 2: { text: "First Name", answer: "John" }
        // Format 3: { name: "First Name", answer: { name: "John" } } (for dropdowns)
        // Format 4: { name: "First Name", answer: "John", value: "John" }
        
        const fieldName = (ans.name || ans.text || ans.title || '').toLowerCase().trim()
        let value = ''
        
        // Handle different answer formats
        if (typeof ans.answer === 'object' && ans.answer !== null) {
          // For dropdowns/selects, answer might be an object
          value = ans.answer.name || ans.answer.text || ans.answer.value || JSON.stringify(ans.answer) || ''
        } else {
          // Ensure we get the full string value, not truncated
          value = String(ans.answer || ans.value || ans.text || '').trim()
        }
        
        // Log for debugging
        if (fieldName.includes('phone') || fieldName.includes('address')) {
          console.log(`📞 Field: ${fieldName}, Raw value: ${JSON.stringify(ans.answer)}, Extracted: ${value}`)
        }
        
        // Store by field name
        if (fieldName) {
          answerMap[fieldName] = value
        }
        
        // Also store by field ID for lookup
        if (ans.id) {
          answerMap[`id_${ans.id}`] = value
        }
        
        // Store by answer ID if present
        if (ans.answerID) {
          answerMap[`answer_${ans.answerID}`] = value
        }
      })
      
      console.log('📋 Parsed answer map:', JSON.stringify(answerMap, null, 2))
      
      // Parse name fields - handle both "First Name" and "Last Name" separately
      // Try multiple variations
      firstName = answerMap['first name'] || answerMap['firstname'] || answerMap['firstName'] || 
                  answerMap['name']?.split(' ')[0] || answerMap['name']?.split(',')[0] || 
                  answerMap['id_3'] || '' // Field ID 3 is typically First Name
      lastName = answerMap['last name'] || answerMap['lastname'] || answerMap['lastName'] || 
                 answerMap['name']?.split(' ').slice(1).join(' ') || answerMap['name']?.split(',')[1] || 
                 answerMap['id_4'] || '' // Field ID 4 is typically Last Name
      
      // Email - try multiple field names and IDs
      email = answerMap['email'] || answerMap['e-mail'] || answerMap['email address'] || 
              answerMap['id_9'] || '' // Field ID 9 is typically Email
      
      // Phone - try multiple field names and IDs, ensure we get the FULL value
      phone = answerMap['phone'] || answerMap['phone number'] || answerMap['mobile'] || 
              answerMap['mobile phone'] || answerMap['cell phone'] || answerMap['telephone'] || 
              answerMap['id_8'] || '' // Field ID 8 is typically Phone Number
      
      // Ensure phone is a string and not truncated
      if (phone && typeof phone === 'string') {
        phone = phone.trim()
      }
      
      // Address - try to get FULL address, not just zip code
      // First try full address fields
      address = answerMap['address'] || answerMap['street address'] || answerMap['full address'] ||
                answerMap['street'] || answerMap['city'] || answerMap['state'] || 
                // Then try zip code as fallback
                answerMap['zip code'] || answerMap['zipcode'] || 
                answerMap['zip code?'] || answerMap['postal code'] || answerMap['id_7'] || ''
      
      // If we only have zip code, try to build full address from multiple fields
      if (!address || address.length < 10) {
        const addressParts = []
        if (answerMap['street address'] || answerMap['street']) {
          addressParts.push(answerMap['street address'] || answerMap['street'])
        }
        if (answerMap['city']) {
          addressParts.push(answerMap['city'])
        }
        if (answerMap['state']) {
          addressParts.push(answerMap['state'])
        }
        if (answerMap['zip code'] || answerMap['zipcode'] || answerMap['zip code?']) {
          addressParts.push(answerMap['zip code'] || answerMap['zipcode'] || answerMap['zip code?'])
        }
        if (addressParts.length > 0) {
          address = addressParts.join(', ')
        }
      }
      
      // Ensure address is a string and not truncated
      if (address && typeof address === 'string') {
        address = address.trim()
      }
      
      // Language and preferences
      language = answerMap['language'] || answerMap['language preference'] || 'English'
      
      // Interest type - map dental form fields
      interestType = answerMap['interest type'] || answerMap['category'] || answerMap['type'] || 
                     answerMap['level of dental work needed'] || answerMap['level of dental work needed ?'] ||
                     answerMap['dental work'] || answerMap['id_11'] || 'PROSPECT'
      
      // Appointment/time preferences
      appointmentTime = answerMap['appointment time'] || answerMap['appointment'] || 
                        answerMap['preferred appointment time'] || 
                        answerMap['best time of day to reach you'] || 
                        answerMap['best time of day to reach you?'] || answerMap['id_10'] || ''
      
      // Notes and additional info
      notes = answerMap['notes'] || answerMap['additional notes'] || answerMap['additional notes:'] ||
              answerMap['comments'] || answerMap['message'] || answerMap['id_13'] || ''
      
      // Source tracking - check for dental office referral
      source = answerMap['utm_source'] || answerMap['source'] || answerMap['referral source'] || 
               answerMap['name of the dental office referring you'] || 
               answerMap['name of the dental office referring you?'] || 
               answerMap['id_14'] || 'JotForm'
      
      // Referral code
      referralCode = answerMap['referral code'] || answerMap['referral_code'] || ''
      
      console.log('✅ Extracted data:', {
        firstName,
        lastName,
        email,
        phone,
        source,
        referralCode,
      })
    }
    
    // Fallback to other formats
    firstName = firstName || body.formData?.firstName || body.firstName || body['First Name'] || body['first name'] || ''
    lastName = lastName || body.formData?.lastName || body.lastName || body['Last Name'] || body['last name'] || ''
    email = email || body.formData?.email || body.email || body['Email'] || body['e-mail'] || ''
    phone = phone || body.formData?.phone || body.mobilePhone || body.phone || body['Phone'] || body['Mobile Phone'] || ''
    address = address || body.formData?.address || body.address || body['Address'] || ''
    language = language || body.formData?.language || body.languagePreference || body.language || 'English'
    interestType = interestType || body.formData?.interestType || body.category || body.interestType || 'PROSPECT'
    appointmentTime = appointmentTime || body.formData?.appointmentTime || body.preferredAppointmentTime || body.appointmentTime || ''
    notes = notes || body.formData?.notes || body.notes || body['Notes'] || ''
    source = source || body.formData?.utm_source || body.utm_source || body.source || 'JotForm'
    referralCode = referralCode || body.formData?.referral_code || body.referral_code || body.referralCode || ''
    
    // Extract from URL parameters if present (from QR code UTM params)
    let qrCodeId: string | null = null
    try {
      const url = new URL(request.url)
      source = url.searchParams.get('utm_source') || source
      referralCode = url.searchParams.get('referral_code') || referralCode
      qrCodeId = url.searchParams.get('qr_code_id')
    } catch (e) {
      // URL parsing failed, continue with defaults
    }

    // Also check for QR code ID and referral code in form data (JotForm can pass these)
    if (body.answers) {
      body.answers.forEach((ans: any) => {
        const fieldName = (ans.name?.toLowerCase() || ans.text?.toLowerCase() || '').trim()
        const value = ans.answer || ans.value || ''
        
        if (fieldName.includes('qr_code_id') || fieldName.includes('qr code id')) {
          qrCodeId = value || qrCodeId
        }
        if (fieldName.includes('referral_code') || fieldName.includes('referral code')) {
          referralCode = value || referralCode
        }
      })
    }
    
    // Check formData as well
    if (body.formData) {
      qrCodeId = body.formData.qr_code_id || body.formData.qrCodeId || qrCodeId
      referralCode = body.formData.referral_code || body.formData.referralCode || referralCode
    }

    // Determine status based on form submission
    let status = 'LEAD'
    if (appointmentTime) {
      status = 'SCHEDULED'
    }

    // Determine category
    let category = 'PROSPECT'
    if (interestType) {
      const categoryMap: { [key: string]: string } = {
        'Consumer': 'CONSUMER',
        'Dental Office': 'DENTAL_OFFICE_PARTNER',
        'Health Office': 'HEALTH_OFFICE_PARTNER',
        'Business Partner': 'OTHER_BUSINESS_PARTNER',
        'Prospect': 'PROSPECT',
      }
      category = categoryMap[interestType] || 'PROSPECT'
    }

    // Ensure we have at least a name
    if (!firstName && !lastName) {
      // Try to extract from a full name field
      const fullName = body.formData?.name || body.name || body['Name'] || body['Full Name'] || ''
      if (fullName) {
        const nameParts = fullName.trim().split(' ')
        firstName = nameParts[0] || 'Unknown'
        lastName = nameParts.slice(1).join(' ') || 'Contact'
      } else {
        firstName = 'Unknown'
        lastName = 'Contact'
      }
    }
    
    // Validate we have at least email or phone - but be more lenient for testing
    if (!email && !phone) {
      console.warn('⚠️ JotForm webhook: No email or phone provided, using placeholder')
      // Create contact anyway with placeholder data for testing
      email = `noreply-${Date.now()}@jotform.local`
    }
    
    // Ensure email is valid format (not empty string)
    if (email && email.trim() === '') {
      email = undefined
    }
    if (phone && phone.trim() === '') {
      phone = undefined
    }

    // Find or create contact
    let contact = await prisma.contact.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ mobilePhone: phone }] : []),
        ],
      },
    })

    if (contact) {
      // Update existing contact
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: {
          firstName: firstName || contact.firstName,
          lastName: lastName || contact.lastName,
          email: email || contact.email,
          mobilePhone: phone || contact.mobilePhone,
          address: address || contact.address,
          languagePreference: language || contact.languagePreference,
          category: category as any,
          status: status as any,
        },
      })
      console.log('Updated existing contact:', contact.id)
    } else {
      // Create new contact
      contact = await prisma.contact.create({
        data: {
          firstName,
          lastName,
          email: (email && email.trim()) || undefined,
          mobilePhone: (phone && phone.trim()) || undefined,
          address: (address && address.trim()) || undefined,
          languagePreference: language,
          category: category as any,
          status: status as any,
        },
      })
      console.log('Created new contact:', contact.id)

      // Track referral conversion if referral code provided
      if (referralCode) {
        try {
          const { trackReferralConversion } = await import('@/lib/referral-links')
          await trackReferralConversion(referralCode, contact.id)
        } catch (err) {
          // Log but don't fail contact creation
          console.error('Failed to track referral conversion:', err)
        }
      }
    }

    // Add source tag
    if (source) {
      await prisma.contactTag.upsert({
        where: {
          contactId_name: {
            contactId: contact.id,
            name: `Referral Source: ${source}`,
          },
        },
        create: {
          contactId: contact.id,
          name: `Referral Source: ${source}`,
        },
        update: {},
      })
    }

    // Add language tag if not English
    if (language && language !== 'English') {
      await prisma.contactTag.upsert({
        where: {
          contactId_name: {
            contactId: contact.id,
            name: `Language: ${language}`,
          },
        },
        create: {
          contactId: contact.id,
          name: `Language: ${language}`,
        },
        update: {},
      })
    }

    // Set enrolled date if status is ENROLLED or ACTIVE_CLIENT
    if (status === 'ENROLLED' || status === 'ACTIVE_CLIENT') {
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          enrolledDate: new Date(),
        },
      })

      // Auto-start referral drip campaign for consumers
      if (category === 'CONSUMER') {
        try {
          const referralCampaign = await prisma.campaign.findFirst({
            where: {
              type: 'REFERRAL_DRIP',
              category: 'CONSUMER',
              isActive: true,
            },
          })

          if (referralCampaign) {
            await prisma.campaignContact.create({
              data: {
                campaignId: referralCampaign.id,
                contactId: contact.id,
                status: 'ACTIVE',
                currentStep: 0,
              },
            })
          }
        } catch (err) {
          console.error('Failed to start referral campaign:', err)
        }
      }

      // Send portal redirect email
      if (contact.email && contact.emailOptIn) {
        try {
          const { sendEmail, getPortalRedirectEmailTemplate } = await import('@/lib/email')
          const policy = await prisma.policy.findFirst({
            where: { contactId: contact.id },
            orderBy: { createdAt: 'desc' },
          })

          const portalLinks = {
            memberPortal: policy?.memberPortalLink || undefined,
            pharmacy: policy?.pharmacyLink || undefined,
            riderBenefits: policy?.riderBenefitsLink || undefined,
            supportPhone: process.env.SUPPORT_PHONE,
            supportChat: process.env.SUPPORT_CHAT_URL,
            appointmentLink: `${process.env.NEXT_PUBLIC_APP_URL}/appointments?contact=${contact.id}`,
          }

          const emailContent = getPortalRedirectEmailTemplate(
            `${contact.firstName} ${contact.lastName}`,
            portalLinks
          )

          await sendEmail(
            contact.email,
            'Your Member Portal Access',
            emailContent,
            contact.id
          )
        } catch (err) {
          console.error('Failed to send portal email:', err)
        }
      }
    }

    // Create task for appointment confirmation if scheduled
    if (status === 'SCHEDULED' && appointmentTime) {
      await prisma.task.create({
        data: {
          contactId: contact.id,
          title: 'Confirm Appointment',
          description: `Appointment scheduled for ${appointmentTime}. Please confirm.`,
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      })
    }

    // Track QR code scan if QR code ID was provided
    if (qrCodeId) {
      try {
        const { trackQRScan } = await import('@/lib/qrcode')
        await trackQRScan(qrCodeId)
        console.log('✅ QR code scan tracked:', qrCodeId)
      } catch (err) {
        console.error('Failed to track QR scan:', err)
        // Don't fail the webhook if QR tracking fails
      }
    }

    await logAudit('JOTFORM_SUBMISSION', undefined, contact.id)

    console.log('✅ JotForm webhook success - Contact created/updated:', {
      contactId: contact.id,
      name: `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
      phone: contact.mobilePhone,
      source,
      referralCode: referralCode || 'none',
      qrCodeId: qrCodeId || 'none',
    })

    return NextResponse.json({ 
      success: true, 
      contactId: contact.id,
      qrCodeId: qrCodeId || null,
      referralCode: referralCode || null,
      message: 'Contact processed successfully'
    })
  } catch (error: any) {
    console.error('❌ JotForm webhook error:', error)
    console.error('Error stack:', error.stack)
    console.error('Request body:', JSON.stringify(body, null, 2))
    
    // Return 200 to prevent JotForm from retrying, but log the error
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        message: 'Webhook received but failed to process. Check server logs.'
      },
      { status: 200 } // Return 200 so JotForm doesn't retry
    )
  }
}

