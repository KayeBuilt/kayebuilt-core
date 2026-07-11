import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatCard } from './stat-card.js';

describe('StatCard', () => {
  it('renders label, value, and a positive delta', () => {
    render(<StatCard label="Max cash out" value="$42,000" delta="+4.2% vs last month" />);
    expect(screen.getByText('Max cash out')).toBeTruthy();
    expect(screen.getByText('$42,000')).toBeTruthy();
    const delta = screen.getByText('+4.2% vs last month');
    expect(delta.className).toContain('text-emerald-600');
  });

  it('colors a negative delta as destructive', () => {
    render(<StatCard label="Runway" value="3 mo" delta="-1.1% vs last month" />);
    const delta = screen.getByText('-1.1% vs last month');
    expect(delta.className).toContain('text-destructive');
  });

  it('omits the delta line entirely when not provided', () => {
    render(<StatCard label="Open draws" value={4} />);
    expect(screen.getByText('4')).toBeTruthy();
  });
});
