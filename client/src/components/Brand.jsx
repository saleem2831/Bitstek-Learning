import React from 'react';
import {Link} from 'react-router-dom';

/** Official Bitstek Learning artwork supplied by the brand team. */
export default function Brand({inverse=false}) {
  return <Link to="/" className={`brand official-brand ${inverse?'brand-inverse':''}`} aria-label="Bitstek Learning home">
    <img src="/brand/logo-white.svg" alt="Bitstek Learning" className="official-brand-white" width="205" height="65" />
  </Link>;
}
