// @vitest-environment jsdom
// players ticked for comparison are kept in the URL, so they survive a refresh
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import Players from '../pages/Players';
import { ToastProvider } from '../context/ToastContext';

// fake api: two players, no network
vi.mock('../services/playerService', () => ({
  getPlayers: vi.fn(async () => ({
    data: [
      { id: 55, name: 'Harry Kane', position: 'Forward', age: 31, team: 'Bayern Munich', goals: 36, assists: 8 },
      { id: 62, name: 'Pedri', position: 'Midfielder', age: 22, team: 'Barcelona', goals: 4, assists: 9 },
    ],
    meta: { page: 1, limit: 25, total: 2, totalPages: 1 },
  })),
}));

// shows the current address so the tests can check it
function CurrentUrl() {
  const { search } = useLocation();
  return <output data-testid="url">{search}</output>;
}

function openPlayersAt(url) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <ToastProvider>
        <Routes>
          <Route
            path="/players"
            element={
              <>
                <Players />
                <CurrentUrl />
              </>
            }
          />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
}

// each player has two checkboxes (table on desktop, cards on phones), so check them all
const boxesFor = (name) => screen.findAllByRole('checkbox', { name: `Select ${name} for comparison` });
const url = () => screen.getByTestId('url').textContent;

afterEach(() => {
  cleanup();
  sessionStorage.clear(); // the page remembers filters for the session, start each test fresh
});

test('players already in the URL show as ticked, like after a refresh', async () => {
  openPlayersAt('/players?compare=55');
  for (const box of await boxesFor('Harry Kane')) expect(box.checked).toBe(true);
  for (const box of await boxesFor('Pedri')) expect(box.checked).toBe(false);
  expect(screen.getByText(/of 4 selected/).textContent).toContain('1 of 4 selected');
});

test('ticking a player adds them to the URL', async () => {
  openPlayersAt('/players');
  const [pedri] = await boxesFor('Pedri');
  fireEvent.click(pedri);
  await waitFor(() => expect(url()).toBe('?compare=62'));
});

test('Clear removes the selection from the URL', async () => {
  openPlayersAt('/players?compare=55,62');
  await boxesFor('Pedri');
  fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
  await waitFor(() => expect(url()).toBe(''));
});
