import React from 'react';

export const AsciiTopologyWidget: React.FC = () => {
  return (
    <pre style={{ color: 'var(--cyan)', fontSize: '9.5px', lineHeight: '1.3' }}>
{`[ 000.localhost:3000 ] --- MASTER INGRESS
 ├── GCP Cloud Run  [8080] -- 24ms (OK)
 ├── Gemini AI API  [443]  -- 34ms (OK)
 ├── Firebase Sync  [WSS]  -- 18ms (OK)
 └── Cloud SQL PG   [5432] -- 14ms (OK)`}
    </pre>
  );
};
