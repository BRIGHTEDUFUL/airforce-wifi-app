import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}

export function generatePassword(length: number = 12, includeSymbols: boolean = true, includeNumbers: boolean = true) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ" + 
    (includeNumbers ? "0123456789" : "") + 
    (includeSymbols ? "!@#$%^&*()_+~`|}{[]:;?><,./-=" : "");
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

export function generateStructuredPassword(location: string, role: string) {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${location.toUpperCase()}-${role.toUpperCase()}-${date}-${random}`;
}
