import { useState, useEffect } from 'react';
import { useFreighter } from './hooks/useFreighter';
import { useAnalytics } from './hooks/useAnalytics';
import { FeedbackModal } from './components/FeedbackModal';
import { ErrorBoundary } from './components/ErrorBoundary';

interface Location {
  lat: number;
  lng: number;
}

function AppContent() {
  const { walletConnected, address, connect } = useFreighter();
  const { trackEvent } = useAnalytics();
  const [location, setLocation] = useState<Location | null>(null);
  const [tier, setTier] = useState<number>(1);
  const [txState, setTxState] = useState<string>('idle');
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (walletConnected) {
      trackEvent('wallet_connected', { address });
    }
  }, [walletConnected, trackEvent, address]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error obtaining location", error);
        }
      );
    }
  }, []);

  const handlePurchase = async () => {
    if (!walletConnected) {
      connect();
      return;
    }
    
    setTxState('broadcasting');
    trackEvent('policy_purchase_initiated', { tier });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTxState('success');
      trackEvent('policy_purchase_confirmed', { tier, address });
    } catch (error) {
      console.error(error);
      setTxState('error');
      trackEvent('policy_purchase_failed', { error: String(error) });
    }
  };

  const simulateRain = async () => {
    trackEvent('simulate_rain_triggered', { address });
    alert("Simulation Triggered! Contacting Smart Contract...");
    // Call force_trigger_payout logic here
  };

  return (
    <>
      <header>
        <h1>RainGuard</h1>
        <p>Parametric Weather Insurance</p>
      </header>

      {!walletConnected ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>Welcome</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Connect your Freighter wallet to access on-chain weather protection for your business.
          </p>
          <button className="button" onClick={connect}>
            Connect Freighter Wallet
          </button>
        </div>
      ) : (
        <>
          <div className="card">
            <h3>Active Vendor Profile</h3>
            <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Wallet: </span>
              {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
            </div>
            
            <div style={{ fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Location: </span>
              {location 
                ? `${location.lat.toFixed(4)}°N, ${location.lng.toFixed(4)}°E` 
                : 'Detecting...'
              }
            </div>
          </div>

          {txState === 'success' ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="status-badge" style={{ marginBottom: '1rem', fontSize: '1rem', padding: '0.5rem 1rem' }}>Active Coverage</div>
              <h3>Policy Registered</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Your {tier === 1 ? '₹50' : '₹100'} premium has been escrowed. Payout will be triggered automatically if rainfall exceeds 15mm.
              </p>
              <button className="button" onClick={() => setTxState('idle')} style={{ marginTop: '1rem', background: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)' }}>
                View Dashboard
              </button>
            </div>
          ) : (
            <div className="card">
              <h3>Coverage Configuration</h3>
              <div className="input-group">
                <label>Select Coverage Tier</label>
                <select value={tier} onChange={(e) => setTier(Number(e.target.value))}>
                  <option value={1}>Tier 1: ₹50 Premium ➔ ₹500 Payout</option>
                  <option value={2}>Tier 2: ₹100 Premium ➔ ₹1000 Payout</option>
                </select>
              </div>

              <div className="input-group">
                <label>Duration</label>
                <select disabled>
                  <option>30 Days (Standard)</option>
                </select>
              </div>

              <button 
                className="button" 
                onClick={handlePurchase}
                disabled={txState === 'broadcasting' || !location}
              >
                {txState === 'broadcasting' ? 'Confirming...' : `Pay ₹${tier === 1 ? '50' : '100'} USDC`}
              </button>
              {txState === 'error' && (
                <p style={{ color: 'var(--warning)', fontSize: '0.75rem', marginTop: '0.5rem', textAlign: 'center' }}>
                  Transaction failed. Please try again.
                </p>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
            <button className="button" style={{ background: 'transparent', border: '1px solid var(--warning)', color: 'var(--warning)', width: 'auto' }} onClick={simulateRain}>
              Simulate Rain 🌧️
            </button>
            <button className="button" style={{ background: 'transparent', border: '1px solid var(--text-secondary)', width: 'auto' }} onClick={() => setShowFeedback(true)}>
              Feedback
            </button>
          </div>
        </>
      )}

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
