import { Shield } from 'lucide-react';
import SlideArrowButton from './ui/SlideArrowButton';
import InfiniteMovingCards, { type TestimonialItem } from './ui/infinite-moving-cards';
import { SparklesCore } from './ui/sparkles';
import './WelcomeScreen.css';

interface Props {
  onEnter: () => void;
}

const testimonials: TestimonialItem[] = [
  {
    quote:
      "Never ignore an unusual transaction. A few seconds of verification can prevent a major financial loss.",
    name: "Fraud Awareness",
    title: "Stay Alert",
  },
  {
    quote:
      "If a transaction looks suspicious, pause before you proceed. Trust your instincts and verify the details.",
    name: "Financial Safety",
    title: "Think Before You Transact",
  },
  {
    quote:
      "Fraudsters rely on urgency. Take your time, verify the transaction, and never let pressure make the decision for you.",
    name: "Security Tip",
    title: "Don't Rush",
  },
  {
    quote:
      "Monitor your transactions regularly. Early detection of unusual activity can make all the difference.",
    name: "Fraud Prevention",
    title: "Monitor Your Money",
  },
  {
    quote:
      "A transaction being successful doesn't always mean it's safe. Look for unusual patterns and investigate anything unexpected.",
    name: "Transaction Security",
    title: "Look Beyond Success",
  },
  {
    quote:
      "Protect your finances by questioning transactions that don't match your usual spending behavior.",
    name: "Smart Finance",
    title: "Know Your Spending",
  },
  {
    quote:
      "When fraud is detected early, the damage can often be reduced. Stay informed, stay vigilant, and act quickly.",
    name: "Fraud Detection",
    title: "Detect Early",
  },
  {
    quote:
      "Your financial security starts with awareness. Every transaction deserves a second look when something feels unusual.",
    name: "Financial Awareness",
    title: "Stay One Step Ahead",
  },
];

export default function WelcomeScreen({ onEnter }: Props) {
  return (
    <div className="welcome-container">
      {/* Safe, non-interfering background glow layers */}
      <div className="welcome-bg-glow-1" />
      <div className="welcome-bg-glow-2" />
      
      <div className="welcome-content">
        {/* Shield icon */}
        <div className="welcome-icon-wrapper">
          <Shield size={28} color="white" strokeWidth={2.5} />
        </div>

        {/* Aceternity Sparkles Title for FraudGuard AI */}
        <div className="sparkles-title-wrapper">
          <h1 className="sparkles-title">
            FraudGuard <span className="sparkles-title-accent">AI</span>
          </h1>

          <div className="sparkles-field-container">
            {/* Glowing laser beams */}
            <div className="sparkles-beam-indigo-blur" />
            <div className="sparkles-beam-indigo-sharp" />
            <div className="sparkles-beam-cyan-blur" />
            <div className="sparkles-beam-cyan-sharp" />

            {/* Sparkles particle core */}
            <SparklesCore
              background="transparent"
              minSize={0.6}
              maxSize={1.8}
              particleDensity={800}
              className="w-full h-full"
              particleColor="#6366f1"
            />

            {/* Radial gradient mask preventing sharp edges */}
            <div className="sparkles-radial-mask" />
          </div>
        </div>

        <p className="welcome-subtitle">
          Machine Learning-Based Transaction Fraud Detection and Risk Assessment
        </p>
        
        <SlideArrowButton text="Get Started" onClick={onEnter} />

        {/* Continuous moving awareness and security tips marquee */}
        <InfiniteMovingCards items={testimonials} speed="normal" />
      </div>
    </div>
  );
}
