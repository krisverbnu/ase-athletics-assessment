// All the player filters in one panel. Used by the Players page (and later the dashboard).
// It doesn't fetch players itself: it only reports the new filters through onChange.
import MultiSelect from '../common/MultiSelect';
import RangeSlider from '../common/RangeSlider';
import { Spinner } from '../common/States';
import { useApi } from '../../hooks';
import { getFilterOptions } from '../../services/playerService';
import { formatMoney, POSITIONS, POSITION_STYLES } from '../../utils/format';

const MILLION = 1_000_000;

export default function FilterPanel({ filters, onChange }) {
  // Teams, nationalities and min/max values come from the API, so they always match the data
  const { data: options, loading, error } = useApi(() => getFilterOptions(), []);

  const set = (changes) => onChange({ ...filters, ...changes });

  const togglePosition = (position) => set({
    position: filters.position.includes(position)
      ? filters.position.filter((p) => p !== position)
      : [...filters.position, position],
  });

  if (loading) return <Spinner label="Loading filters..." />;
  if (error) return <p className="text-sm text-red-700">{error}</p>;

  const { ranges } = options;
  const maxValueM = Math.ceil((ranges.marketValue.max || 0) / MILLION);

  return (
    <div className="flex flex-col gap-6">
      {/* Positions: toggle buttons, several can be on at once */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-secondary-700">Position</legend>
        <div className="flex flex-wrap gap-2">
          {POSITIONS.map((position) => {
            const isOn = filters.position.includes(position);
            return (
              <button key={position} type="button" aria-pressed={isOn} onClick={() => togglePosition(position)}
                className={`h-10 rounded-full border px-4 text-sm font-medium transition-colors ${
                  isOn ? `${POSITION_STYLES[position]} border-transparent ring-2 ring-primary-600` : 'border-secondary-300 bg-white text-secondary-700 hover:bg-secondary-50'}`}>
                {position}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <MultiSelect label="Team" options={options.teams} selected={filters.team} onChange={(team) => set({ team })} placeholder="Any team" />
        <MultiSelect label="Nationality" options={options.nationalities} selected={filters.nationality}
          onChange={(nationality) => set({ nationality })} placeholder="Any nationality" />
      </div>

      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <RangeSlider label="Age" min={ranges.age.min} max={ranges.age.max}
          value={[filters.ageMin, filters.ageMax]} onCommit={([ageMin, ageMax]) => set({ ageMin, ageMax })} />
        <RangeSlider label="Market value" min={0} max={maxValueM} format={(m) => formatMoney(m * MILLION)}
          value={[filters.valueMin && filters.valueMin / MILLION, filters.valueMax && filters.valueMax / MILLION]}
          onCommit={([lo, hi]) => set({ valueMin: lo && lo * MILLION, valueMax: hi && hi * MILLION })}
          hint="Only players with a known market value are included when this is set." />
        <RangeSlider label="Goals" min={0} max={ranges.goals.max}
          value={[filters.goalsMin, filters.goalsMax]} onCommit={([goalsMin, goalsMax]) => set({ goalsMin, goalsMax })} />
        <RangeSlider label="Assists" min={0} max={ranges.assists.max}
          value={[filters.assistsMin, filters.assistsMax]} onCommit={([assistsMin, assistsMax]) => set({ assistsMin, assistsMax })} />
      </div>
    </div>
  );
}
