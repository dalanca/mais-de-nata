import { supabaseAdmin } from '../server/database/supabase.js'

type WholesaleRegistrationRequest = {
  companyId: string
  contactName: string
  email: string
  phone: string

  deliverySameAsCompany: boolean

  deliveryStreet?: string
  deliveryHouseNumber?: string
  deliveryPostcode?: string
  deliveryCity?: string
  deliveryCountry?: string

  businessDetails?: string
}

type AresCompany = {
  ico: string
  companyName: string
  vatNumber: string
  street: string
  houseNumber: string
  postcode: string
  city: string
  country: string
}

export default async function handler(
  request: any,
  response: any,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({
      success: false,
      message: 'Method not allowed',
    })
  }

  try {
    const body =
      request.body as WholesaleRegistrationRequest | undefined

    if (!body) {
      return response.status(400).json({
        success: false,
        message: 'Registration data is required',
      })
    }

    const companyId =
      body.companyId?.replace(/\s/g, '') ?? ''

    const email =
      body.email?.trim().toLowerCase() ?? ''

    const contactName =
      body.contactName?.trim() ?? ''

    const phone =
      body.phone?.trim() ?? ''

    if (!/^\d{8}$/.test(companyId)) {
      return response.status(400).json({
        success: false,
        message: 'Invalid IČO',
      })
    }

    if (!email || !contactName || !phone) {
      return response.status(400).json({
        success: false,
        message: 'Required contact information is missing',
      })
    }

    // Re-check the company directly with ARES.
    // Never trust the browser's companyVerified state.
    const aresResponse = await fetch(
      `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${companyId}`,
      {
        headers: {
          Accept: 'application/json',
        },
      },
    )

    if (!aresResponse.ok) {
      return response.status(400).json({
        success: false,
        message: 'Company could not be verified with ARES',
      })
    }

    const rawCompany = await aresResponse.json()

    if (
      !rawCompany?.ico ||
      !rawCompany?.obchodniJmeno
    ) {
      return response.status(400).json({
        success: false,
        message: 'Company could not be verified with ARES',
      })
    }

    const address = rawCompany.sidlo ?? {}

    const houseNumberParts = [
      address.cisloDomovni,
      address.cisloOrientacni
        ? `/${address.cisloOrientacni}${
            address.cisloOrientacniPismeno ?? ''
          }`
        : '',
    ].filter(Boolean)

    const company: AresCompany = {
      ico: rawCompany.ico,
      companyName: rawCompany.obchodniJmeno,
      vatNumber: rawCompany.dic ?? '',
      street: address.nazevUlice ?? '',
      houseNumber: houseNumberParts.join(''),
      postcode: address.psc
        ? String(address.psc).padStart(5, '0')
        : '',
      city:
        address.nazevObce ??
        address.nazevMestskeCastiObvodu ??
        '',
      country: 'Czech Republic',
    }

    // Prevent the same IČO from being registered twice.
    const {
      data: existingCompany,
      error: existingCompanyError,
    } = await supabaseAdmin
      .from('wholesale_customers')
      .select('id')
      .eq('company_id', company.ico)
      .maybeSingle()

    if (existingCompanyError) {
      throw existingCompanyError
    }

    if (existingCompany) {
      return response.status(409).json({
        success: false,
        message: 'This company is already registered',
      })
    }

// Invite the wholesale user.
const {
  data: inviteData,
  error: inviteError,
} = await supabaseAdmin.auth.admin.inviteUserByEmail(
  email,
  {
    redirectTo:
      'http://localhost:5173/wholesale-account-setup',

    data: {
      contact_name: contactName,
      company_id: company.ico,
      company_name: company.companyName,
    },
  },
)

    if (inviteError) {
      console.error(
        'Wholesale user invitation failed:',
        inviteError,
      )

      return response.status(400).json({
        success: false,
        message: inviteError.message,
      })
    }

    const userId = inviteData.user?.id

    if (!userId) {
      throw new Error(
        'Supabase did not return an invited user ID',
      )
    }

    const {
      error: profileError,
    } = await supabaseAdmin
      .from('wholesale_customers')
      .insert({
        id: userId,

        company_name: company.companyName,
        company_id: company.ico,
        vat_number: company.vatNumber || null,

        contact_name: contactName,
        email,
        phone,

        company_street: company.street,
        company_house_number: company.houseNumber,
        company_postcode: company.postcode,
        company_city: company.city,
        company_country: company.country,

        delivery_same_as_company:
          body.deliverySameAsCompany,

        delivery_street:
          body.deliverySameAsCompany
            ? null
            : body.deliveryStreet?.trim() || null,

        delivery_house_number:
          body.deliverySameAsCompany
            ? null
            : body.deliveryHouseNumber?.trim() || null,

        delivery_postcode:
          body.deliverySameAsCompany
            ? null
            : body.deliveryPostcode?.trim() || null,

        delivery_city:
          body.deliverySameAsCompany
            ? null
            : body.deliveryCity?.trim() || null,

        delivery_country:
          body.deliverySameAsCompany
            ? null
            : body.deliveryCountry?.trim() || null,

        business_details:
          body.businessDetails?.trim() || null,

        company_verified: true,
        company_verified_at:
          new Date().toISOString(),

        account_status: 'pending_activation',
      })

    if (profileError) {
      console.error(
        'Wholesale customer profile creation failed:',
        profileError,
      )

      // Avoid leaving an orphaned Auth user behind.
      await supabaseAdmin.auth.admin.deleteUser(userId)

      throw profileError
    }

    return response.status(201).json({
      success: true,
      message:
        'Wholesale registration created successfully',
    })
  } catch (error) {
    console.error(
      'Wholesale registration failed:',
      error,
    )

    return response.status(500).json({
      success: false,
      message: 'Unable to create wholesale registration',
    })
  }
}