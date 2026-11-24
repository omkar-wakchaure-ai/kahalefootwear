import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './database';

const DEFAULT_COUNTRY_CODE = '+91';

export function normalizePhoneNumber(value, countryCode = DEFAULT_COUNTRY_CODE) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  if (raw.startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `${countryCode}${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `${countryCode}${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;

  return `+${digits}`;
}

export function isValidPhoneNumber(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

export async function saveCustomerProfile({ uid, name, mobileNumber }) {
  const customerRef = doc(db, 'customers', uid);
  const existing = await getDoc(customerRef);

  if (existing.exists()) {
    await setDoc(
      customerRef,
      {
        uid,
        name,
        mobileNumber,
      },
      { merge: true },
    );
    return;
  }

  await setDoc(customerRef, {
    uid,
    name,
    mobileNumber,
    createdAt: serverTimestamp(),
  });
}
