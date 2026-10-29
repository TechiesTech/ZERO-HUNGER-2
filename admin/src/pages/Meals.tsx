import React from 'react';

/**
 * Meals page — placeholder.
 * TODO: Implement meal catalogue management (add, edit, archive meals).
 */
export function Meals(): React.ReactElement {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Meals</h1>
      <p className="mt-2 text-sm text-white/40">
        Manage meal listings, pricing, and availability.
        {/* TODO: implement data table, create/edit form, image upload */}
      </p>
    </div>
  );
}
