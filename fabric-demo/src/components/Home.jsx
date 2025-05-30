import React from 'react';

export default function Home() {
  return (
    <div className="text-center my-5">
      <img
        src="/logo.png"
        alt="PriceTracker Logo"
        width={200}
        height={200}
        className="mb-4"
      />
      <h2>Добро пожаловать в PriceTracker</h2>
    </div>
  );
}