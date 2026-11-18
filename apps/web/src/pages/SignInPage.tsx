import { SignInOverlay } from '../components/SignInOverlay';

/**
 * App gate shown at /app when no Firebase session exists.
 *
 * The marketing site lives at / and is fully independent (no Firebase).
 * Closing the overlay returns to the landing page.
 */
export const SignInPage = () => (
  <SignInOverlay
    onClose={() => {
      window.location.assign('/');
    }}
  />
);
