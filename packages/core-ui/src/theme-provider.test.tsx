import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider, useTheme } from './theme-provider.js';

function Consumer() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button type="button" onClick={() => setTheme('dark')}>
        go-dark
      </button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('defaults to light and applies the .dark class on change', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <Consumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => {
      screen.getByText('go-dark').click();
    });

    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('persists the chosen theme to localStorage and restores it on remount', () => {
    const first = render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <Consumer />
      </ThemeProvider>,
    );
    act(() => {
      first.getByText('go-dark').click();
    });
    expect(window.localStorage.getItem('test-theme')).toBe('dark');
    first.unmount();

    const second = render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <Consumer />
      </ThemeProvider>,
    );
    expect(second.getByTestId('theme').textContent).toBe('dark');
  });

  it('throws when useTheme is called outside a provider', () => {
    const BadConsumer = () => {
      useTheme();
      return null;
    };
    expect(() => render(<BadConsumer />)).toThrow(/must be called within a <ThemeProvider>/);
  });
});
