/**
 * InputText
 *
 * Reusable controlled text input for forms across the admin.
 *
 * @module customizing/InputText
 */
import * as React from "react"

type Props = {
  placeholder?: string | undefined,
  name?: string | undefined
  type?: string | undefined
  text?: string | undefined
  value?: string | undefined
  // React 19 types the ref of `useRef<HTMLInputElement>(null)` as nullable.
  refs?: React.RefObject<HTMLInputElement | null>;
  setLocation?: () => void;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formHandler?: (e: React.FormHTMLAttributes<HTMLFormElement>) => void;
}

const InputText = ({ placeholder, name, type, text, value, refs, onChange, onClick, setLocation }: Props) => {
  const customValue = () => {
    return type === "submit" ? { value: text } : { defaultValue: value === "0" ? "" : value };
  }

  if (type === "submit") {
    return null;
  }

  return (
    <input
      onChange={onChange}
      onClick={onClick}
      placeholder={placeholder}
      name={name}
      ref={refs}
      className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden transition-all placeholder:text-gray-400"
      type={type}
      {...customValue()}
    />
  )
}

export default InputText
