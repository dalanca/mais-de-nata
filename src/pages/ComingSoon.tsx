import { useState } from 'react'
import SiteHeader from '../components/SiteHeader'
import { useLanguage } from '../LanguageContext'
import './ComingSoon.css'

export default function ComingSoon() {
    const { t, language } = useLanguage()

    const [firstName, setFirstName] =
        useState('')

    const [email, setEmail] =
        useState('')

    const [isSubmitting, setIsSubmitting] =
        useState(false)

    const [successMessage, setSuccessMessage] =
        useState('')

    const [errorMessage, setErrorMessage] =
        useState('')

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        setSuccessMessage('')
        setErrorMessage('')
        setIsSubmitting(true)

        try {
            const response =
                await fetch('/api/launch-register', {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',
                    },

                    body: JSON.stringify({
                        firstName,
                        email,
                        language,
                    }),
                })

            const data =
                await response.json() as {
                    success: boolean
                    alreadyRegistered?: boolean
                    message?: string
                }

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    'Unable to complete registration',
                )
            }

            setSuccessMessage(
                data.alreadyRegistered
                    ? t.comingSoonAlreadyRegistered
                    : t.comingSoonSuccess,
            )

            if (!data.alreadyRegistered) {
                setFirstName('')
                setEmail('')
            }
        } catch (error) {
            setErrorMessage(
                t.comingSoonError,
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <SiteHeader />

            <main className="comingSoonPage">
                <section className="comingSoonHero">
                    <div className="comingSoonGrid">
                        <div className="comingSoonContent">
                            <p className="comingSoonEyebrow">
                                {t.comingSoonEyebrow}
                            </p>

                            <h1>
                                {t.comingSoonTitle}
                            </h1>

                            <p className="comingSoonIntro">
                                {t.comingSoonIntro}
                            </p>

                            <div className="comingSoonOffer">
                                <p className="comingSoonOfferEyebrow">
                                    {t.comingSoonOfferEyebrow}
                                </p>

                                <h2>
                                    {t.comingSoonOfferTitle}
                                </h2>

                                <p>
                                    {t.comingSoonOfferText}
                                </p>

                                <p className="comingSoonDeliveryNote">
                                    {t.comingSoonDeliveryNote}
                                </p>
                            </div>

                            <form
                                className="comingSoonForm"
                                onSubmit={handleSubmit}
                            >
                                <label>
                                    {t.comingSoonFirstName}

                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(event) =>
                                            setFirstName(
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                </label>

                                <label>
                                    {t.comingSoonEmail}

                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                </label>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? t.comingSoonSubmitting
                                        : t.comingSoonSubmit}
                                </button>
                            </form>

                            {successMessage && (
                                <div className="comingSoonSuccess">
                                    {successMessage}
                                </div>
                            )}

                            {errorMessage && (
                                <div className="comingSoonError">
                                    {errorMessage}
                                </div>
                            )}

                            <p className="comingSoonTerms">
                                {t.comingSoonTerms}
                            </p>
                        </div>

                        <div className="comingSoonVisual">
                            <div className="comingSoonVisualOverlay">
                                <span>
                                    {t.comingSoonVisualLabel}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}