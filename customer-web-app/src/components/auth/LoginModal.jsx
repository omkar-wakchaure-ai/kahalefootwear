import { useEffect, useRef, useState } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { AlertCircle, ArrowLeft, Loader2, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../services/database';
import {
  isValidPhoneNumber,
  normalizePhoneNumber,
  saveCustomerProfile,
} from '../../services/customerProfile';

const RECAPTCHA_CONTAINER_ID = 'firebase-recaptcha-container';

const AUTH_ERROR_MESSAGES = {
  'auth/invalid-phone-number': 'Enter a valid mobile number with country code.',
  'auth/missing-phone-number': 'Please enter your mobile number.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/invalid-verification-code': 'That OTP is incorrect. Please check the code and try again.',
  'auth/invalid-verification-id': 'Your verification session expired. Please request a new OTP.',
  'auth/code-expired': 'That OTP has expired. Please request a new one.',
  'auth/captcha-check-failed': 'The reCAPTCHA check failed. Refresh the page and try again.',
  'auth/invalid-app-credential':
    'Phone sign-in is not authorized for this domain. Add your domain in Firebase Authentication settings.',
  'auth/quota-exceeded': 'The SMS quota has been exceeded. Please try again later.',
  'auth/operation-not-allowed': 'Phone sign-in is not enabled in the Firebase console.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
};

function getAuthErrorMessage(error) {
  return (
    AUTH_ERROR_MESSAGES[error?.code] ||
    'We could not verify your number right now. Please try again.'
  );
}

function maskPhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  const lastFour = phoneNumber.slice(-4);
  return `${phoneNumber.slice(0, 3)} •••• ${lastFour}`;
}

export default function LoginModal() {
  const { loginOpen, closeLogin, completeLogin } = useAuth();
  const [step, setStep] = useState('details');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const verifierRef = useRef(null);

  useEffect(() => {
    if (!loginOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) closeLogin();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [busy, closeLogin, loginOpen]);

  useEffect(
    () => () => {
      try {
        verifierRef.current?.clear();
      } catch {
        // The verifier may already have been torn down by Firebase.
      }
      verifierRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (loginOpen) {
      setStep('details');
      setOtp('');
      setVerificationId(null);
      setConfirmationResult(null);
      setError('');
    }
  }, [loginOpen]);

  if (!loginOpen) return null;

  const getVerifier = () => {
    if (!verifierRef.current) {
      verifierRef.current = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
        size: 'invisible',
      });
    }
    return verifierRef.current;
  };

  const resetVerifier = () => {
    try {
      verifierRef.current?.clear();
    } catch {
      // Ignore teardown failures.
    }
    verifierRef.current = null;
  };

  const sendOtp = async (event) => {
    event?.preventDefault();
    if (busy) return;

    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!isValidPhoneNumber(phone)) {
      setError('Please enter a valid mobile number.');
      return;
    }

    const e164Phone = normalizePhoneNumber(phone);
    setBusy(true);
    setError('');

    try {
      const verifier = getVerifier();
      const confirmation = await signInWithPhoneNumber(auth, e164Phone, verifier);
      setConfirmationResult(confirmation);
      setVerificationId(confirmation.verificationId || null);
      setNormalizedPhone(e164Phone);
      setOtp('');
      setStep('otp');
      resetVerifier();
    } catch (error) {
      console.error('Firebase Auth Error:', error);
      resetVerifier();
      setError(getAuthErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    if (busy || !confirmationResult) return;

    const code = otp.replace(/\D/g, '');
    if (code.length !== 6) {
      setError('Enter the 6-digit OTP sent to your phone.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const credential = await confirmationResult.confirm(code);
      await saveCustomerProfile({
        uid: credential.user.uid,
        name: fullName.trim(),
        mobileNumber: normalizedPhone,
      });
      completeLogin();
    } catch (error) {
      console.error('Firebase Auth Error:', error);
      setError(getAuthErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const goBackToDetails = () => {
    setStep('details');
    setOtp('');
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) closeLogin();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-red-600">
              Kahale Footwear
            </p>
            <h2 id="login-title" className="mt-1 text-2xl font-extrabold text-gray-900">
              {step === 'details' ? 'Sign in to continue' : 'Verify your number'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {step === 'details'
                ? 'We will send a one-time password to your mobile number.'
                : `Enter the 6-digit code sent to ${maskPhoneNumber(normalizedPhone)}.`}
            </p>
          </div>
          <button
            type="button"
            onClick={closeLogin}
            disabled={busy}
            aria-label="Close sign in"
            className="rounded-full bg-gray-100 p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'details' ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <label
                htmlFor="login-full-name"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Full Name
              </label>
              <input
                id="login-full-name"
                type="text"
                required
                autoComplete="name"
                placeholder="Your full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="login-phone"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Mobile Number
              </label>
              <input
                id="login-phone"
                type="tel"
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-gray-900"
              />
              <p className="mt-1.5 text-xs text-gray-400">
                Use your country code. Indian numbers can be entered as a 10-digit number.
              </p>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 font-bold text-white shadow-lg shadow-gray-900/20 transition-all hover:bg-gray-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div>
              <label
                htmlFor="login-otp"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                One-Time Password
              </label>
              <input
                id="login-otp"
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6-digit code"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-xl font-bold tracking-[0.4em] outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-gray-900"
              />
              {verificationId && (
                <p className="mt-1.5 text-center text-xs text-gray-400">
                  Verification ID: {verificationId.slice(0, 10)}…
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {busy ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={goBackToDetails}
                disabled={busy}
                className="inline-flex items-center gap-1 font-semibold text-gray-600 transition-colors hover:text-gray-900 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Change number
              </button>
              <button
                type="button"
                onClick={() => sendOtp()}
                disabled={busy}
                className="font-semibold text-red-600 transition-colors hover:text-red-700 disabled:opacity-50"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        <div id={RECAPTCHA_CONTAINER_ID} />
      </div>
    </div>
  );
}
