import React from 'react';

export default function Quote({ quote }) {
  return (
    <div className="quote-section">
      <div className="quote-card">
        <div className="quote-text">"{quote.quote}"</div>
        <div className="quote-author">— {quote.author}</div>
      </div>
    </div>
  );
}