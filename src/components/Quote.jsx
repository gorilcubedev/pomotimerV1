import React, { useState, useEffect } from 'react';

export default function Quote() {
  const [quote, setQuote] = useState({
    quote: "Loading inspirational quotes...",
    author: "Please wait"
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadQuote = async () => {
      try {
        // Fetch quotes from JSON file
        const response = await fetch('/quotes.json');

        if (!response.ok) {
          throw new Error(`Failed to load quotes: ${response.status}`);
        }

        const quotes = await response.json();

        if (!Array.isArray(quotes) || quotes.length === 0) {
          throw new Error('Invalid quotes format or empty quotes array');
        }

        // Select random quote
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const selectedQuote = quotes[randomIndex];

        // Validate quote structure
        if (!selectedQuote.quote || !selectedQuote.author) {
          throw new Error('Quote missing required fields (quote or author)');
        }

        setQuote(selectedQuote);

      } catch (err) {
        console.error('Error loading quote:', err);
        setError(err.message);
        setQuote({
          quote: "Unable to load quotes. Please check quotes.json file.",
          author: "Error"
        });
      } finally {
        setLoading(false);
      }
    };

    loadQuote();
  }, []);

  if (loading) {
    return (
      <div className="quote-section">
        <div className="quote-card">
          <div className="quote-text">Loading inspirational quotes...</div>
          <div className="quote-author">— Please wait</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quote-section">
        <div className="quote-card">
          <div className="quote-text">"{quote.quote}"</div>
          <div className="quote-author">— {quote.author}</div>
          <div className="quote-error" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quote-section">
      <div className="quote-card">
        <div className="quote-text">{quote.quote}</div>
        <div className="quote-author">— {quote.author}</div>
        {quote.category && (
          <div className="quote-category" style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginTop: '0.5rem',
            textTransform: 'capitalize'
          }}>
          </div>
        )}
      </div>
    </div>
  );
}