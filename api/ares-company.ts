type AresAddress = {
  nazevUlice?: string
  cisloDomovni?: number
  cisloOrientacni?: number
  cisloOrientacniPismeno?: string
  nazevObce?: string
  nazevMestskeCastiObvodu?: string
  psc?: number
  textovaAdresa?: string
}

type AresCompany = {
  ico?: string
  obchodniJmeno?: string
  dic?: string
  sidlo?: AresAddress
}

export default async function handler(
  request: any,
  response: any,
) {
  if (request.method !== 'GET') {
    return response.status(405).json({
      success: false,
      message: 'Method not allowed',
    })
  }

  const rawIco = request.query?.ico

  const ico =
    typeof rawIco === 'string'
      ? rawIco.replace(/\s/g, '')
      : ''

  if (!/^\d{8}$/.test(ico)) {
    return response.status(400).json({
      success: false,
      message: 'IČO must contain exactly 8 digits',
    })
  }

  try {
    const aresResponse = await fetch(
      `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`,
      {
        headers: {
          Accept: 'application/json',
        },
      },
    )

    if (aresResponse.status === 404) {
      return response.status(404).json({
        success: false,
        message: 'Company not found',
      })
    }

    if (!aresResponse.ok) {
      console.error(
        'ARES lookup failed:',
        aresResponse.status,
        await aresResponse.text(),
      )

      return response.status(502).json({
        success: false,
        message: 'Unable to verify company with ARES',
      })
    }

    const company =
      (await aresResponse.json()) as AresCompany

    if (!company.ico || !company.obchodniJmeno) {
      return response.status(404).json({
        success: false,
        message: 'Company not found',
      })
    }

    const address = company.sidlo ?? {}

    const houseNumberParts = [
      address.cisloDomovni,
      address.cisloOrientacni
        ? `/${address.cisloOrientacni}${address.cisloOrientacniPismeno ?? ''}`
        : '',
    ].filter(Boolean)

    return response.status(200).json({
      success: true,

      company: {
        ico: company.ico,
        companyName: company.obchodniJmeno,
        vatNumber: company.dic ?? '',
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
        formattedAddress: address.textovaAdresa ?? '',
      },
    })
  } catch (error) {
    console.error('ARES lookup failed:', error)

    return response.status(500).json({
      success: false,
      message: 'Unable to verify company',
    })
  }
}