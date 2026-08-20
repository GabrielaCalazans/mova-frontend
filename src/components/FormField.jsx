<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
﻿import { useState } from "react";

const EyeIcon = ({ open }) =>
  open ? (
    /* olho aberto — senha visível */
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    /* olho fechado — senha oculta */
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

function FormField({
<<<<<<< HEAD
=======
﻿function FormField({
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  id,
  name,
  type = "text",
  placeholder,
  ariaLabel,
<<<<<<< HEAD
  label,
=======
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
  value,
  onChange,
  required = false,
  error,
  helperText,
  helperType = "warning",
  inputState,
  inputMode,
  autoComplete,
  disabled = false,
}) {
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordField = type === "password";
  const resolvedType = isPasswordField && showPassword ? "text" : type;

<<<<<<< HEAD
=======
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  const hintId = `${id}-hint`;
  const hasMessage = Boolean(error || helperText);

  const messageClassName = error
    ? "auth-message auth-message--error"
    : `auth-message auth-message--${helperType}`;

  const dataState = !error && inputState && inputState !== "default" ? inputState : undefined;

  return (
    <div className="auth-field">
<<<<<<< HEAD
<<<<<<< HEAD
      {label && <label htmlFor={id}>{label}</label>}
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
      <div className={isPasswordField ? "auth-field__password-wrapper" : undefined}>
        <input
          id={id}
          name={name}
          type={resolvedType}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-invalid={Boolean(error)}
          aria-describedby={hasMessage ? hintId : undefined}
          value={value}
          onChange={onChange}
          required={required}
          data-state={dataState}
          inputMode={inputMode}
          autoComplete={autoComplete}
          disabled={disabled}
        />

        {isPasswordField && (
          <button
            type="button"
            className="auth-field__eye-btn"
            onClick={() => setShowPassword((v) => !v)}
<<<<<<< HEAD
            aria-label={showPassword ? "Ocultar caracteres digitados" : "Exibir caracteres digitados"}
=======
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
            tabIndex={-1}
          >
            <EyeIcon open={showPassword} />
          </button>
        )}
      </div>
<<<<<<< HEAD
=======
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={Boolean(error)}
        aria-describedby={hasMessage ? hintId : undefined}
        value={value}
        onChange={onChange}
        required={required}
        data-state={dataState}
        inputMode={inputMode}
        autoComplete={autoComplete}
        disabled={disabled}
      />
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2

      {hasMessage && (
        <p id={hintId} className={messageClassName} role={error ? "alert" : undefined}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

export default FormField;