import { COMMON_TIMEZONES } from "@/lib/constants";

export default function TimezoneSelect({
  name = "timezone",
  defaultValue = "Europe/Moscow",
  id,
}: {
  name?: string;
  defaultValue?: string;
  id?: string;
}) {
  const options = COMMON_TIMEZONES.includes(defaultValue)
    ? COMMON_TIMEZONES
    : [defaultValue, ...COMMON_TIMEZONES];

  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
    >
      {options.map((tz) => (
        <option key={tz} value={tz}>
          {tz}
        </option>
      ))}
    </select>
  );
}
