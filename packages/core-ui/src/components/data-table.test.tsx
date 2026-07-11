import type { ColumnDef } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataTable } from './data-table.js';

interface Row {
  name: string;
  amount: number;
}

const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'amount', header: 'Amount' },
];

describe('DataTable', () => {
  it('renders headers and row data', () => {
    render(<DataTable columns={columns} data={[{ name: 'Framing', amount: 1200 }]} />);
    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('Framing')).toBeTruthy();
    expect(screen.getByText('1200')).toBeTruthy();
  });

  it('shows the empty message when there is no data', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeTruthy();
  });
});
