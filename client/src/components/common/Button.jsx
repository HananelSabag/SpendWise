const Button = ({ 
    children, 
    type = 'button', 
    variant = 'primary', 
    fullWidth = false, 
    onClick,
    disabled = false,
    className = ''
  }) => {
    // Using new utility classes from tailwind.config.js
    const variants = {
      primary: 'btn btn-primary',
      secondary: 'btn btn-secondary',
      danger: 'bg-error hover:bg-error-dark text-white'
    };
    
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`
          ${variants[variant]}
          ${fullWidth ? 'w-full' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        {children}
      </button>
    );
  };
  
  export default Button;