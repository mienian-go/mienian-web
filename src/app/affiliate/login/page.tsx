import { redirect } from 'next/navigation';

export default function AffiliateLoginRedirect() {
  redirect('/affiliate/dashboard');
}
