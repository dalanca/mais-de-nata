import { createContext, useContext, useEffect, useState } from "react"
import cs from "./translations/cs"
import en from "./translations/en"

type Language = "cs" | "en"

const translations = {
  cs,
  en,
}

const LanguageContext = createContext({
  language: "cs" as Language,
  setLanguage: (_language: Language) => {},
  t: cs,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language")
    return saved === "en" ? "en" : "cs"
  })
  useEffect(() => {
    localStorage.setItem("language", language)
  }, [language])
  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}