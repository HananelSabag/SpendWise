const Button = ({ 
  children, 
  type = 'button', 
  variant = 'primary', 
  fullWidth = false, 
  onClick,
  disabled = false,
  className = ''
}) => {
  const baseStyles = "px-4 py-3 rounded-xl font-medium focus:outline-none transition-all duration-200";
  const variants = {
      primary: "bg-teal-500 text-white hover:bg-teal-600 shadow-lg hover:shadow-xl",
      secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
      danger: "bg-red-500 text-white hover:bg-red-600"
  };

  const disabledStyles = "opacity-50 cursor-not-allowed";
  
  return (
      <button
          type={type}
          onClick={onClick}
          disabled={disabled}
          className={`
              ${baseStyles}
              ${variants[variant]}
              ${fullWidth ? 'w-full' : ''}
              ${disabled ? disabledStyles : ''}
              ${className}
          `}
      >
          {children}
      </button>
  );
};

export default Button;