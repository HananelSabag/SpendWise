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
      <div className={`flex flex-col ${className}`}>
          {label && (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  {label}
              </label>
          )}
          <div className="relative">
              {Icon && (
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icon className="h-5 w-5 text-teal-500" />
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
                      ${Icon ? 'pl-10' : 'pl-4'} 
                      pr-4 
                      py-3 
                      border 
                      border-gray-200 
                      rounded-xl 
                      focus:ring-2 
                      focus:ring-teal-500 
                      focus:border-transparent 
                      transition 
                      duration-200
                      ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
                      ${error ? 'border-red-500 focus:ring-red-500' : ''}
                  `}
                  {...props}
              />
          </div>
          {error && (
              <p className="mt-1 text-sm text-red-500">{error}</p>
          )}
      </div>
  );
};

export default Input;