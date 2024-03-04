export const Button = ({ children, onClick, disabled }) => {
  return (
    <button
      className={`text-white py-2 bg-[#F3AF00] rounded cursor-pointer text-center w-full ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
