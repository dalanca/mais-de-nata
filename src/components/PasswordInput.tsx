import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import './PasswordInput.css'

type PasswordInputProps = {
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  name?: string
  id?: string
}

function PasswordInput({
  value,
  onChange,
  autoComplete,
  placeholder,
  required = false,
  disabled = false,
  name,
  id,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="passwordInputWrapper">
      <input
        id={id}
        name={name}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />

      <button
        type="button"
        className="passwordInputToggle"
        onClick={() =>
          setShowPassword((current) => !current)
        }
        aria-label={
          showPassword
            ? 'Hide password'
            : 'Show password'
        }
        aria-pressed={showPassword}
        disabled={disabled}
      >
        {showPassword ? (
          <EyeOff size={20} aria-hidden="true" />
        ) : (
          <Eye size={20} aria-hidden="true" />
        )}
      </button>
    </div>
  )
}

export default PasswordInput