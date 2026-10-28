import React from 'react';

/**
 * Dashboard page — placeholder.
 * TODO: Add summary stats cards (total orders, meals delivered, riders active, revenue).
 */
export function Dashboard(): React.ReactElement {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      <p className="mt-2 text-sm text-white/40">
        Overview of meal deliveries, orders, and rider activity.
        {/* TODO: implement stats cards, charts and recent activity feed */}
      </p>
    </div>
  );
}
