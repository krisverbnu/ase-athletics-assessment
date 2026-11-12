// Analytics dashboard. Every number comes from one call to /api/dashboard/stats,
// which accepts the same filters as the player list, so all cards and charts
// update together when a filter changes. Filters live in the URL, like on Players.
import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { CalendarClock, ChartLine, Coins, Goal, SearchX, SlidersHorizontal, Users } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { DashboardSkeleton, EmptyState, ErrorState } from '../components/common/States';
import ActiveFilters from '../components/filters/ActiveFilters';
import FilterPanel from '../components/filters/FilterPanel';
import ChartCard from '../components/dashboard/ChartCard';
import {
  AgeGroupsChart,
  AttributesRadar,
  GoalsByPositionChart,
  TeamsChart,
  ValueTrendsChart,
} from '../components/dashboard/Charts';
import { buildTrendRows } from '../utils/chartData';
import RankedList from '../components/dashboard/RankedList';
import StatTile from '../components/dashboard/StatTile';
import ContractsTile from '../components/dashboard/ContractsTile';
import DataQualityCard from '../components/dashboard/DataQualityCard';
import { useApi } from '../hooks';
import { getDashboardStats } from '../services/dashboardService';
import { downloadCsv } from '../utils/csv';
import { countActive, filtersToParams, readFilters } from '../utils/filters';
import { formatDate, formatMoney } from '../utils/format';

export default function Dashboard() {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const activeCount = countActive(filters);
  const [showFilters, setShowFilters] = useState(false);

  const filterKey = JSON.stringify(filtersToParams(filters));
  const { data: response, loading, error, reload } = useApi(() => getDashboardStats(filters), [filterKey]);

  // Arriving from an "About the data" link: scroll to the panel once it has loaded
  const location = useLocation();
  useEffect(() => {
    if (response && location.hash === '#data-quality') {
      document.getElementById('data-quality')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response, location.hash]);

  const setFilters = (next) => setParams(filtersToParams(next));
  const clearAll = () => setParams({});

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
          <p className="mt-1 text-sm text-secondary-500">
            Season 2024-25 at a glance, from data dated {response ? formatDate(response.meta.dataDate) : '8 Jul 2025'}.{' '}
            <a href="#data-quality" className="font-medium text-primary-700 underline">
              About the data
            </a>
          </p>
        </div>
        <div>
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            icon={SlidersHorizontal}
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
          >
            Filters{activeCount > 0 && ` (${activeCount})`}
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="motion-safe:animate-slide-down">
          <FilterPanel filters={filters} onChange={setFilters} />
        </Card>
      )}
      <ActiveFilters filters={filters} onChange={setFilters} onClearAll={clearAll} />

      {loading && <DashboardSkeleton />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {response && response.data.kpis.totalPlayers === 0 && (
        <Card>
          <EmptyState
            icon={SearchX}
            title="No players match these filters"
            action={
              <Button variant="secondary" size="sm" onClick={clearAll}>
                Clear filters
              </Button>
            }
          />
        </Card>
      )}
      {response && response.data.kpis.totalPlayers > 0 && <DashboardContent stats={response.data} />}
      {response && response.data.dataQuality && (
        <DataQualityCard quality={response.data.dataQuality} dataDate={formatDate(response.meta.dataDate)} />
      )}
    </div>
  );
}

function DashboardContent({ stats }) {
  const { kpis } = stats;
  const mostValuable = stats.mostValuable[0];
  const topTrends = [...stats.marketValueTrends]
    .sort((a, b) => b.history.at(-1).value - a.history.at(-1).value)
    .slice(0, 5);

  return (
    <>
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Players" icon={Users} value={kpis.totalPlayers} detail={`Average age ${kpis.averageAge}`} />
        <StatTile
          label="Top scorer"
          icon={Goal}
          value={kpis.topScorer?.name ?? '–'}
          detail={kpis.topScorer ? `${kpis.topScorer.goals} goals · ${kpis.topScorer.team}` : null}
        />
        <StatTile
          label="Most valuable"
          icon={Coins}
          value={mostValuable?.name ?? 'No values'}
          detail={
            mostValuable
              ? `${formatMoney(mostValuable.marketValue)} · ${kpis.playersWithMarketValue} players valued`
              : 'Market values not available'
          }
        />
        {stats.contractStatus ? (
          <ContractsTile status={stats.contractStatus} />
        ) : (
          <StatTile
            label="Expiring contracts"
            icon={CalendarClock}
            value={kpis.contractsExpiringWithin12Months}
            detail={`Next 12 months · ${kpis.expiredContracts} expired`}
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Goals and assists by position"
          subtitle="Where the goal contributions come from"
          onExport={() =>
            downloadCsv('goals-by-position.csv', stats.byPosition, [
              { label: 'Position', value: (r) => r.position },
              { label: 'Players', value: (r) => r.players },
              { label: 'Goals', value: (r) => r.goals },
              { label: 'Assists', value: (r) => r.assists },
            ])
          }
        >
          <GoalsByPositionChart data={stats.byPosition} />
        </ChartCard>
        <ChartCard
          title="Age profile"
          subtitle="How young or experienced the pool is"
          onExport={() =>
            downloadCsv('age-groups.csv', stats.ageGroups, [
              { label: 'Age group', value: (r) => r.label },
              { label: 'Players', value: (r) => r.players },
            ])
          }
        >
          <AgeGroupsChart data={stats.ageGroups} />
        </ChartCard>
      </div>

      <ChartCard
        title="Market value over time"
        subtitle="The most valuable players with a valuation history"
        onExport={
          topTrends.length
            ? () =>
                downloadCsv('market-value-trends.csv', buildTrendRows(topTrends), [
                  { label: 'Date', value: (r) => new Date(r.time).toISOString().slice(0, 10) },
                  ...topTrends.map((t) => ({ label: t.name, value: (r) => r[t.name] })),
                ])
            : undefined
        }
      >
        {topTrends.length ? (
          <ValueTrendsChart trends={topTrends} />
        ) : (
          <EmptyState
            icon={ChartLine}
            title="No valuation history for these players"
            message="Market values are only available for 12 players in the source data."
          />
        )}
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Average attributes by position"
          subtitle="Ratings out of 100"
          onExport={() =>
            downloadCsv('attributes-by-position.csv', stats.attributesByPosition, [
              { label: 'Position', value: (r) => r.position },
              ...['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'].map((a) => ({
                label: a,
                value: (r) => r[a],
              })),
            ])
          }
        >
          <AttributesRadar data={stats.attributesByPosition} />
        </ChartCard>
        <ChartCard
          title="Players per team"
          subtitle="Top 10 clubs in the database"
          onExport={() =>
            downloadCsv('players-per-team.csv', stats.teams, [
              { label: 'Team', value: (r) => r.team },
              { label: 'Players', value: (r) => r.players },
            ])
          }
        >
          <TeamsChart data={stats.teams} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Most productive per 90" subtitle="Goals + assists per 90 minutes (min. 900 minutes)">
          <RankedList items={stats.topPer90.slice(0, 5)} value={(p) => p.goalContributionsPer90.toFixed(2)} />
        </ChartCard>
        <ChartCard title="Best value for money" subtitle="Goals + assists per €10K of weekly salary">
          <RankedList items={stats.bestValueForMoney} value={(p) => p.contributionsPer10k.toFixed(1)} />
        </ChartCard>
        <ChartCard title="Contracts ending soon" subtitle="Ending within 12 months of the data date (8 Jul 2025)">
          <RankedList
            items={stats.expiringContracts.slice(0, 5)}
            value={(p) => formatDate(p.contractEnd)}
            empty="No contracts end within 12 months."
          />
        </ChartCard>
      </div>
    </>
  );
}
