export const isValidEmail = (email: string): boolean => {
  const value = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

export const isValidName = (name: string): boolean => {
  const trimmedName = name.trim();
  
  // Length check
  if (trimmedName.length < 4) {
    return false;
  }

  // Character constraint check (Optional Improvement)
  // Supports international letters (À-ÿ), spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-ZÀ-ÿ\s\-\']+$/;
  return nameRegex.test(trimmedName);
};