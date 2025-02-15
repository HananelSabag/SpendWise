const Input = ({ 
    label, 
    type = 'text', 
    value, 
    onChange, 
    placeholder,
    required = false,
    disabled = false,
    icon: Icon,
    className = '',
    error,
    ...props 
  }) => {
    return (
      <div className={`flex flex-col w-full ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative w-full">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="h-5 w-5 text-primary-500" />
            </div>
          )}
          <input
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            className={`
              w-full
              px-4
              py-3
              rounded-xl
              border
              border-gray-200
              outline-none
              transition
              duration-200
              ${Icon ? 'pl-10' : ''}
              ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
              ${error ? 'border-error focus:ring-2 focus:ring-error' : 'focus:ring-2 focus:ring-primary-500 focus:border-transparent'}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
      </div>
    );
  };
  
  export default Input;