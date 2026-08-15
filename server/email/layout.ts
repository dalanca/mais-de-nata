type EmailLanguage = 'en' | 'cs'

type BrandedEmailLayoutOptions = {
  title: string
  previewText?: string
  content: string
  language?: EmailLanguage
}

const EMAIL_LOGO_URL =
  'cid:mais-de-nata-logo'

export function createEmailButton(
  label: string,
  url: string,
) {
  return `
    <table
      role="presentation"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="margin: 28px 0;"
    >
      <tr>
        <td
          align="center"
          bgcolor="#4e312d"
          style="
            border-radius: 999px;
            background-color: #4e312d;
          "
        >
          <a
            href="${url}"
            target="_blank"
            style="
              display: inline-block;
              padding: 14px 26px;
              color: #ffffff;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 14px;
              font-weight: 700;
              line-height: 1;
              text-decoration: none;
              border-radius: 999px;
            "
          >
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `
}

export function createBrandedEmailLayout({
  title,
  previewText = '',
  content,
  language = 'en',
}: BrandedEmailLayoutOptions) {
  const text =
    language === 'cs'
      ? {
          brandLine:
            'AUTENTICKÉ PORTUGALSKÉ PASTÉIS DE NATA',
          questions: 'Máte otázky?',
          website: 'www.maisdenata.com',
          footer:
            'Ručně vyrobeno v Portugalsku. Čerstvě upečeno v Praze.',
          company:
            'Mais de Nata je obchodní značka společnosti CafSpresso s.r.o.',
        }
      : {
          brandLine:
            'AUTHENTIC PORTUGUESE PASTÉIS DE NATA',
          questions: 'Questions?',
          website: 'www.maisdenata.com',
          footer:
            'Handmade in Portugal. Baked fresh in Prague.',
          company:
            'Mais de Nata is a trading name of CafSpresso s.r.o.',
        }

  const year =
    new Date().getFullYear()

  return `
    <!doctype html>
    <html lang="${language}">
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>${title}</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f5efe6;
          color: #2b1d16;
          font-family: Arial, Helvetica, sans-serif;
        "
      >
        <div
          style="
            display: none;
            max-height: 0;
            max-width: 0;
            overflow: hidden;
            opacity: 0;
            color: transparent;
          "
        >
          ${previewText}
        </div>

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          bgcolor="#f5efe6"
          style="
            width: 100%;
            background-color: #f5efe6;
          "
        >
          <tr>
            <td
              align="center"
              style="
                padding: 36px 14px;
              "
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                bgcolor="#ffffff"
                style="
                  width: 100%;
                  max-width: 620px;
                  background-color: #ffffff;
                  border: 1px solid #eadfce;
                  border-radius: 20px;
                  overflow: hidden;
                "
              >
                <!-- Brand header -->
                <tr>
                  <td
                    align="center"
                    bgcolor="#fffaf2"
                    style="
                      padding: 32px 30px 28px;
                      background-color: #fffaf2;
                      border-bottom: 1px solid #eadfce;
                    "
                  >
                    <img
                      src="${EMAIL_LOGO_URL}"
                      width="126"
                      alt="Mais de Nata"
                      style="
                        display: block;
                        width: 126px;
                        max-width: 100%;
                        height: auto;
                        margin: 0 auto;
                        border: 0;
                      "
                    />

                    <p
                      style="
                        margin: 20px 0 0;
                        color: #4e312d;
                        font-family: Georgia, 'Times New Roman', serif;
                        font-size: 24px;
                        font-weight: 700;
                        line-height: 1.2;
                        letter-spacing: 1.5px;
                      "
                    >
                      MAIS DE NATA
                    </p>

                    <table
                      role="presentation"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="
                        margin: 14px auto 0;
                      "
                    >
                      <tr>
                        <td
                          width="72"
                          style="
                            width: 72px;
                            border-top: 1px solid #d6a018;
                          "
                        ></td>

                        <td
                          style="
                            padding: 0 12px;
                            color: #d6a018;
                            font-size: 16px;
                            line-height: 1;
                          "
                        >
                          ♥
                        </td>

                        <td
                          width="72"
                          style="
                            width: 72px;
                            border-top: 1px solid #d6a018;
                          "
                        ></td>
                      </tr>
                    </table>

                    <p
                      style="
                        margin: 14px 0 0;
                        color: #7e6258;
                        font-size: 11px;
                        font-weight: 700;
                        line-height: 1.5;
                        letter-spacing: 1.7px;
                      "
                    >
                      ${text.brandLine}
                    </p>
                  </td>
                </tr>

                <!-- Email content -->
                <tr>
                  <td
                    style="
                      padding: 42px 44px 38px;
                      color: #2b1d16;
                      font-size: 15px;
                      line-height: 1.7;
                    "
                  >
                    <h1
                      style="
                        margin: 0 0 24px;
                        color: #4e312d;
                        font-family: Georgia, 'Times New Roman', serif;
                        font-size: 31px;
                        font-weight: 700;
                        line-height: 1.18;
                      "
                    >
                      ${title}
                    </h1>

                    <div
                      style="
                        width: 46px;
                        margin: 0 0 26px;
                        border-top: 3px solid #d6a018;
                      "
                    ></div>

                    ${content}
                  </td>
                </tr>

                <!-- Gold divider -->
                <tr>
                  <td
                    height="5"
                    bgcolor="#d6a018"
                    style="
                      height: 5px;
                      background-color: #d6a018;
                      font-size: 0;
                      line-height: 0;
                    "
                  >
                    &nbsp;
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td
                    align="center"
                    bgcolor="#4e312d"
                    style="
                      padding: 28px 32px 30px;
                      background-color: #4e312d;
                    "
                  >
                    <p
                      style="
                        margin: 0 0 9px;
                        color: #ffffff;
                        font-size: 13px;
                        line-height: 1.55;
                      "
                    >
                      ${text.questions}
                      <a
                        href="mailto:orders@maisdenata.com"
                        style="
                          color: #ffc000;
                          font-weight: 700;
                          text-decoration: none;
                        "
                      >
                        orders@maisdenata.com
                      </a>
                    </p>

                    <p
                      style="
                        margin: 0 0 14px;
                        font-size: 13px;
                        line-height: 1.5;
                      "
                    >
                      <a
                        href="https://maisdenata.com"
                        target="_blank"
                        style="
                          color: #ffc000;
                          font-weight: 700;
                          text-decoration: none;
                        "
                      >
                        ${text.website}
                      </a>
                    </p>

                    <p
                      style="
                        margin: 0;
                        color: #f8eee4;
                        font-size: 12px;
                        font-weight: 700;
                        line-height: 1.55;
                        letter-spacing: 0.4px;
                      "
                    >
                      ${text.footer}
                    </p>

                    <p
                      style="
                        margin: 16px 0 0;
                        color: #cfbdb4;
                        font-size: 10px;
                        line-height: 1.55;
                      "
                    >
                      ${text.company}<br />
                      © ${year} Mais de Nata
                    </p>
                  </td>
                </tr>
              </table>

              <p
                style="
                  margin: 16px 0 0;
                  color: #8d766b;
                  font-size: 10px;
                  line-height: 1.5;
                "
              >
                CafSpresso s.r.o. · IČO 22365664 · Prague, Czech Republic
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}