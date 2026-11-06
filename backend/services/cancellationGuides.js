/**
 * Pre-verified official cancellation directories for major subscription services
 */
export const CANCELLATION_CATALOG = [
  {
    id: 'netflix',
    name: 'Netflix',
    category: 'Entertainment',
    officialUrl: 'https://www.netflix.com/youraccount',
    directCancelUrl: 'https://www.netflix.com/cancelplan',
    accountSettingsPath: 'Profile Icon -> Account -> Membership & Billing -> Cancel Membership',
    stepByStepGuide: [
      'Sign in to your Netflix account on a web browser.',
      'Click on your Profile icon in the upper-right corner and select "Account".',
      'Under the "Membership & Billing" section, click the "Cancel Membership" button.',
      'Review your cancellation terms and click "Finish Cancellation" to confirm.',
      'A confirmation email will be delivered to your registered email address.',
    ],
    policyNotes:
      'You can cancel at any time. Your streaming access remains available until the final day of your current paid billing period.',
    warnings: [
      'Netflix retains your viewing history and saved preferences for 10 months after cancellation.',
      'No partial month refunds are issued for cancellations mid-cycle.',
    ],
    recommendedDaysBeforeRenewal: 3,
  },
  {
    id: 'spotify',
    name: 'Spotify Premium',
    category: 'Entertainment',
    officialUrl: 'https://www.spotify.com/account/overview/',
    directCancelUrl: 'https://www.spotify.com/account/change-plan/',
    accountSettingsPath: 'Profile -> Account -> Manage your plan -> Change plan -> Cancel Spotify',
    stepByStepGuide: [
      'Log in to spotify.com/account on your desktop or mobile browser.',
      'Scroll down to the "Your plan" section.',
      'Click on "Change plan".',
      'Scroll to "Cancel Spotify" and click "Cancel Premium".',
      'Proceed through the confirmation steps until you see the confirmation screen.',
    ],
    policyNotes:
      'Your Premium subscription stays active until your next billing date. After that, your account reverts to free ad-supported Spotify.',
    warnings: [
      'Downloaded offline music playlists will become inaccessible once Premium expires.',
      'If you subscribed via Apple In-App Purchase or your mobile carrier, you must cancel through Apple Subscriptions or your carrier app.',
    ],
    recommendedDaysBeforeRenewal: 3,
  },
  {
    id: 'amazon_prime',
    name: 'Amazon Prime',
    category: 'Entertainment',
    officialUrl: 'https://www.amazon.in/mc/manage',
    directCancelUrl: 'https://www.amazon.in/gp/primecentral/editMyEnd',
    accountSettingsPath: 'Accounts & Lists -> Prime Membership -> Manage Membership -> End Membership',
    stepByStepGuide: [
      'Sign in to your Amazon account and go to "Your Prime Membership".',
      'Click on the "Manage Membership" dropdown on the right side.',
      'Select "End Membership".',
      'Amazon will display your saved benefits; click through "Continue to Cancel".',
      'Click "Cancel Membership" or "End on [Renewal Date]" on the final screen.',
    ],
    policyNotes:
      'If you have not used any Prime benefits (such as free delivery or Prime Video streaming) during the current term, you may be eligible for a full or prorated refund.',
    warnings: [
      'Ending Prime removes access to Prime Video, Amazon Music, Prime Reading, and free 1-day delivery.',
    ],
    recommendedDaysBeforeRenewal: 2,
  },
  {
    id: 'adobe',
    name: 'Adobe Creative Cloud',
    category: 'Design & Creativity',
    officialUrl: 'https://account.adobe.com/plans',
    directCancelUrl: 'https://account.adobe.com/plans',
    accountSettingsPath: 'Adobe Account -> Plans & Payment -> Manage Plan -> Cancel your plan',
    stepByStepGuide: [
      'Sign in at account.adobe.com/plans.',
      'Click "Manage plan" on the subscription you wish to cancel.',
      'Select "Cancel your plan".',
      'Indicate your cancellation reason and select "Continue".',
      'Review any retention offers or cloud storage notices and confirm cancellation.',
    ],
    policyNotes:
      'Cancellations within 14 days of initial order receive a full refund.',
    warnings: [
      'CRITICAL: Annual contracts paid monthly carry an Early Termination Fee equal to 50% of the remaining contract obligation if cancelled after 14 days.',
      'Cloud storage is reduced to 2GB; unbacked files exceeding 2GB will be deleted after 30 days.',
    ],
    recommendedDaysBeforeRenewal: 7,
  },
  {
    id: 'chatgpt_plus',
    name: 'ChatGPT Plus',
    category: 'Productivity',
    officialUrl: 'https://chatgpt.com',
    directCancelUrl: 'https://chatgpt.com/#settings/Subscription',
    accountSettingsPath: 'Settings -> Subscription -> Manage -> Cancel Plan',
    stepByStepGuide: [
      'Log into ChatGPT at chatgpt.com.',
      'Click on your name / profile icon in the lower-left sidebar.',
      'Select "Settings", then navigate to the "Subscription" tab.',
      'Click "Manage" (this redirects to Stripe billing portal).',
      'Click "Cancel Plan" and confirm on the Stripe checkout page.',
    ],
    policyNotes:
      'Cancellation takes effect the day after the next billing date. You retain full access to GPT-4o, DALL-E, and Advanced Voice until then.',
    warnings: [
      'Custom GPT access and high-capacity limits will revert to free tier quotas upon expiration.',
    ],
    recommendedDaysBeforeRenewal: 3,
  },
  {
    id: 'github_pro',
    name: 'GitHub Pro',
    category: 'Cloud & Dev',
    officialUrl: 'https://github.com/settings/billing',
    directCancelUrl: 'https://github.com/settings/billing',
    accountSettingsPath: 'Settings -> Billing and plans -> Plans and usage -> Edit -> Downgrade to Free',
    stepByStepGuide: [
      'Sign in to GitHub.com and open "Settings".',
      'In the left sidebar, click "Billing and plans".',
      'Under "Plans and usage", click the "Edit" dropdown next to GitHub Pro.',
      'Click "Downgrade to Free".',
      'Select your reason and confirm downgrade.',
    ],
    policyNotes:
      'Your account remains Pro until the end of your prepaid billing period, then smoothly transitions to GitHub Free.',
    warnings: [
      'Private repo wikis, advanced code review tools, and Pro Actions minutes will downgrade.',
    ],
    recommendedDaysBeforeRenewal: 2,
  },
  {
    id: 'google_one',
    name: 'Google One',
    category: 'Cloud & Dev',
    officialUrl: 'https://one.google.com/settings',
    directCancelUrl: 'https://one.google.com/settings',
    accountSettingsPath: 'Google One Settings -> Change membership plan -> Cancel membership',
    stepByStepGuide: [
      'Go to one.google.com/settings on your browser.',
      'Scroll down to "Change membership plan".',
      'Select "Cancel membership" and confirm your choice.',
    ],
    policyNotes:
      'Storage limit returns to standard 15 GB at the end of the billing cycle.',
    warnings: [
      'If stored Gmail, Google Drive, and Photos data exceeds 15GB after expiration, you will NOT be able to send or receive emails.',
    ],
    recommendedDaysBeforeRenewal: 4,
  },
  {
    id: 'microsoft_365',
    name: 'Microsoft 365',
    category: 'Productivity',
    officialUrl: 'https://account.microsoft.com/services',
    directCancelUrl: 'https://account.microsoft.com/services',
    accountSettingsPath: 'Microsoft Account -> Services & subscriptions -> Manage -> Cancel subscription',
    stepByStepGuide: [
      'Sign in at account.microsoft.com/services.',
      'Locate your Microsoft 365 subscription and click "Manage".',
      'Select "Cancel subscription" or "Turn off recurring billing".',
      'Follow the on-screen prompts to complete the request.',
    ],
    policyNotes:
      'Turning off recurring billing allows you to use Word, Excel, and PowerPoint until the subscription term expires.',
    warnings: [
      'OneDrive storage drops from 1TB to 5GB. Back up personal files before expiration.',
    ],
    recommendedDaysBeforeRenewal: 3,
  },
  {
    id: 'hotstar',
    name: 'Disney+ Hotstar',
    category: 'Entertainment',
    officialUrl: 'https://www.hotstar.com/in/my-account',
    directCancelUrl: 'https://www.hotstar.com/in/my-account',
    accountSettingsPath: 'My Account -> Membership Details -> Cancel Membership',
    stepByStepGuide: [
      'Open hotstar.com on a browser and log in with your phone number.',
      'Click on "My Account".',
      'Under "Membership Details", click "Cancel Membership".',
      'Confirm the cancellation prompt.',
    ],
    policyNotes:
      'Access continues until your current paid validity expires.',
    warnings: [
      'No partial refunds for annual plans.',
    ],
    recommendedDaysBeforeRenewal: 3,
  },
  {
    id: 'youtube_premium',
    name: 'YouTube Premium',
    category: 'Entertainment',
    officialUrl: 'https://www.youtube.com/paid_memberships',
    directCancelUrl: 'https://www.youtube.com/paid_memberships',
    accountSettingsPath: 'Profile -> Purchases and memberships -> Manage membership -> Deactivate',
    stepByStepGuide: [
      'Go to youtube.com/paid_memberships.',
      'Click "Manage membership" next to your Premium membership.',
      'Click "Deactivate" and select "Continue to cancel".',
      'Select your reason and confirm.',
    ],
    policyNotes:
      'You will continue to have ad-free YouTube and background playback until the current billing cycle concludes.',
    warnings: [
      'Offline video downloads on mobile devices will be disabled once expired.',
    ],
    recommendedDaysBeforeRenewal: 2,
  },
  {
    id: 'notion',
    name: 'Notion Plus',
    category: 'Productivity',
    officialUrl: 'https://www.notion.so/settings',
    directCancelUrl: 'https://www.notion.so/settings',
    accountSettingsPath: 'Settings & Members -> Billing -> Downgrade plan',
    stepByStepGuide: [
      'Open Notion and go to "Settings & members".',
      'Select "Billing" in the workspace settings.',
      'Under your current plan, click "Change plan" or "Downgrade".',
      'Confirm downgrade to the Free plan.',
    ],
    policyNotes:
      'Workspace retains all existing pages, but page history and guest limits revert to free constraints.',
    warnings: [],
    recommendedDaysBeforeRenewal: 3,
  },
  {
    id: 'subsync_native',
    name: 'SubSync Membership',
    category: 'Productivity',
    officialUrl: 'http://localhost:5173/billing',
    directCancelUrl: 'http://localhost:5173/billing',
    accountSettingsPath: 'SubSync -> Billing & Invoices -> Active Plan -> Cancel Subscription',
    stepByStepGuide: [
      'Navigate to Billing in your SubSync navigation bar.',
      'Locate your active Bronze, Silver, or Gold tier card.',
      'Click the "Cancel Subscription" button.',
      'Confirm cancellation in the verification prompt.',
      'Your account returns to the Free tier immediately or at billing cycle end.',
    ],
    policyNotes:
      'Your saved learning certificates, skill passports, and download history remain safe.',
    warnings: [
      'Daily download quota reverts to Free plan tier limits.',
    ],
    recommendedDaysBeforeRenewal: 1,
  },
];

