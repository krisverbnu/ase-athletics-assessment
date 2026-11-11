// @vitest-environment jsdom
// A component test: render the contracts card and check what a scout would see
import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import ContractsTile from '../components/dashboard/ContractsTile';

afterEach(cleanup);

const status = {
  dataDate: { date: '2025-07-08', expired: 24, endingWithin12Months: 20 },
  today: { date: '2026-11-11', expired: 44, endingWithin12Months: 19 },
};

test('shows both reference dates, each labelled with its date', () => {
  render(<ContractsTile status={status} />);
  const dataRow = screen.getByRole('row', { name: /data date/i });
  const todayRow = screen.getByRole('row', { name: /today/i });

  expect(within(dataRow).getByText('8 Jul 2025')).toBeTruthy();
  expect(within(dataRow).getByText('24')).toBeTruthy();
  expect(within(todayRow).getByText('11 Nov 2026')).toBeTruthy();
  expect(within(todayRow).getByText('44')).toBeTruthy();
  expect(within(todayRow).getByText('19')).toBeTruthy();
});

test('labels the columns so the numbers are never ambiguous', () => {
  render(<ContractsTile status={status} />);
  expect(screen.getByRole('columnheader', { name: 'Expired' })).toBeTruthy();
  expect(screen.getByRole('columnheader', { name: /ending within the next 12 months/i })).toBeTruthy();
});
