import { supabaseAdmin } from '../server/database/supabase.js'

type UpdateWholesaleCustomerRequest = {
  wholesaleCustomerId: string
  vatNumber?: string
  contactName: string
  phone?: string

  companyStreet: string
  companyHouseNumber: string
  companyPostcode: string
  companyCity: string
  companyCountry: string

  deliverySameAsCompany: boolean

  deliveryStreet?: string
  deliveryHouseNumber?: string
  deliveryPostcode?: string
  deliveryCity?: string
  deliveryCountry?: string
}

export default async function handler(
  req: any,
  res: any,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }

  try {
    const {
      wholesaleCustomerId,
      vatNumber,
      contactName,
      phone,
      companyStreet,
      companyHouseNumber,
      companyPostcode,
      companyCity,
      companyCountry,
      deliverySameAsCompany,
      deliveryStreet,
      deliveryHouseNumber,
      deliveryPostcode,
      deliveryCity,
      deliveryCountry,
    } = req.body as UpdateWholesaleCustomerRequest

    if (
      !wholesaleCustomerId ||
      !contactName?.trim() ||
      !companyStreet?.trim() ||
      !companyHouseNumber?.trim() ||
      !companyPostcode?.trim() ||
      !companyCity?.trim() ||
      !companyCountry?.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wholesale company details',
      })
    }

    if (
      !deliverySameAsCompany &&
      (
        !deliveryStreet?.trim() ||
        !deliveryHouseNumber?.trim() ||
        !deliveryPostcode?.trim() ||
        !deliveryCity?.trim() ||
        !deliveryCountry?.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        error: 'Delivery address is incomplete',
      })
    }

    const authorization =
      req.headers.authorization

    if (
      !authorization ||
      !authorization.startsWith('Bearer ')
    ) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      })
    }

    const accessToken =
      authorization.slice('Bearer '.length)

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(
      accessToken,
    )

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session',
      })
    }

    const {
      data: customer,
      error: customerError,
    } = await supabaseAdmin
      .from('wholesale_customers')
      .select(`
        id,
        account_status
      `)
      .eq('id', wholesaleCustomerId)
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (customerError) {
      throw customerError
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        error:
          'The selected wholesale company was not found',
      })
    }

    if (customer.account_status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Wholesale account is not active',
      })
    }

    const {
      data: updatedCustomer,
      error: updateError,
    } = await supabaseAdmin
      .from('wholesale_customers')
      .update({
        vat_number:
          vatNumber?.trim() || null,

        contact_name:
          contactName.trim(),

        phone:
          phone?.trim() || null,

        company_street:
          companyStreet.trim(),

        company_house_number:
          companyHouseNumber.trim(),

        company_postcode:
          companyPostcode.trim(),

        company_city:
          companyCity.trim(),

        company_country:
          companyCountry.trim(),

        delivery_same_as_company:
          deliverySameAsCompany,

        delivery_street:
          deliverySameAsCompany
            ? null
            : deliveryStreet?.trim() || null,

        delivery_house_number:
          deliverySameAsCompany
            ? null
            : deliveryHouseNumber?.trim() || null,

        delivery_postcode:
          deliverySameAsCompany
            ? null
            : deliveryPostcode?.trim() || null,

        delivery_city:
          deliverySameAsCompany
            ? null
            : deliveryCity?.trim() || null,

        delivery_country:
          deliverySameAsCompany
            ? null
            : deliveryCountry?.trim() || null,
      })
      .eq('id', customer.id)
      .eq('auth_user_id', user.id)
      .select(`
        id,
        company_name,
        company_id,
        vat_number,
        contact_name,
        email,
        phone,
        company_street,
        company_house_number,
        company_postcode,
        company_city,
        company_country,
        delivery_same_as_company,
        delivery_street,
        delivery_house_number,
        delivery_postcode,
        delivery_city,
        delivery_country
      `)
      .single()

    if (updateError) {
      throw updateError
    }

    return res.status(200).json({
      success: true,
      customer: updatedCustomer,
    })
  } catch (error) {
    console.error(
      'Unable to update wholesale customer:',
      error,
    )

    return res.status(500).json({
      success: false,
      error:
        'Unable to update wholesale company details',
    })
  }
}