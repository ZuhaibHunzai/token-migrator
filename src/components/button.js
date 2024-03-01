export const Button = ({ children, onClick }) => {
  return (
    <button
      className="text-white px-4 py-2 bg-[#F3AF00] rounded cursor-pointer"
      onClick={onClick}
    >
      {children}
    </button>
  );
};
