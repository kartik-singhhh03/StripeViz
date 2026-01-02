import { useState, useEffect } from 'react';
import { X, AlertTriangle, Key, ExternalLink } from 'lucide-react';

interface TestModeWarningProps {
  isTestMode: boolean;
}

/**
 * TestModeWarning - Toast popup shown once per session when using test keys
 * 
 * Features:
 * - Shows only when stripeMode is 'test'
 * - Appears once per session (uses sessionStorage)
 * - Non-intrusive side popup
 * - Dismissible
 * - Does NOT block usage
 */
export function TestModeWarning({ isTestMode }: TestModeWarningProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show for test mode
    if (!isTestMode) return;

    // Check if already shown this session
    const hasShown = sessionStorage.getItem('stripeviz_test_mode_warning_shown');
    if (hasShown) return;

    // Show warning after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
      sessionStorage.setItem('stripeviz_test_mode_warning_shown', 'true');
    }, 1500);

    return () => clearTimeout(timer);
  }, [isTestMode]);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
      <div className="relative max-w-sm bg-amber-900/95 backdrop-blur-lg border border-amber-500/30 rounded-xl shadow-xl shadow-amber-500/10 p-4">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Dismiss warning"
        >
          <X className="w-4 h-4 text-amber-300/70 hover:text-amber-200" />
        </button>

        {/* Icon and content */}
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="pr-6">
            <h4 className="font-semibold text-amber-100 mb-1 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Stripe Test Mode
            </h4>
            <p className="text-sm text-amber-200/80 leading-relaxed">
              You are using Stripe test keys. Analytics and revenue data are simulated.
              Use live keys for real insights.
            </p>
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-amber-300 hover:text-amber-200 transition-colors"
            >
              Get live API keys
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * TestModeBadge - Small badge shown in dashboard header when using test keys
 */
interface TestModeBadgeProps {
  isTestMode: boolean;
  className?: string;
}

export function TestModeBadge({ isTestMode, className = '' }: TestModeBadgeProps) {
  if (!isTestMode) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold ${className}`}
      title="Using Stripe test keys - data is simulated"
    >
      <Key className="w-3.5 h-3.5" />
      <span>Test Mode</span>
    </div>
  );
}

/**
 * TestModeRestrictionBanner - Shows when viewing analytics with restricted features
 */
interface TestModeRestrictionBannerProps {
  isTestMode: boolean;
  feature?: string;
}

export function TestModeRestrictionBanner({ isTestMode, feature }: TestModeRestrictionBannerProps) {
  if (!isTestMode) return null;

  return (
    <div className="flex items-center gap-2 p-3 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
      <p className="text-sm text-amber-300">
        {feature 
          ? `${feature} data is simulated in test mode.`
          : 'Some metrics are limited in test mode.'
        }
        {' '}
        <span className="text-amber-200/70">Connect live keys for accurate data.</span>
      </p>
    </div>
  );
}

export default TestModeWarning;
