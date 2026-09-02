import type React from 'react';
import GlowingCard from './GlowingCard';
import './KineticTitle.css';

interface KineticTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
  rightElement?: React.ReactNode;
}

export default function KineticTitle({
  title,
  subtitle,
  className = '',
  rightElement,
}: KineticTitleProps) {
  const words = title.split(' ');

  return (
    <div className="title-card-container">
      <GlowingCard
        fromColor="rgba(79, 70, 229, 0.65)"
        viaColor="rgba(147, 51, 234, 0.45)"
        toColor="rgba(37, 99, 235, 0.65)"
        borderRadius="16px"
      >
        <div className="title-card-inner">
          <div className="title-card-left">
            <div className="title-heading-row">
              <span className="title-accent-pill" aria-hidden="true" />
              <div className="text-animation-stage">
                <h1 className={`page-title text-animation-title ${className}`}>
                  {words.map((word, index) => (
                    <span
                      key={`${word}-${index}`}
                      className="text-animation-unit"
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      {word}
                      {index < words.length - 1 ? ' ' : ''}
                    </span>
                  ))}
                </h1>
              </div>
            </div>
            {subtitle && <p className="title-card-subtitle">{subtitle}</p>}
          </div>
          {rightElement && <div className="title-card-right">{rightElement}</div>}
        </div>
      </GlowingCard>
    </div>
  );
}
