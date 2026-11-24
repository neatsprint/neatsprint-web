"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function VelocityChart({
  data,
}: {
  data: Array<{ sprint: string; committed: number; completed: number }>;
}) {
  return (
    <div className="h-64 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
          <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="committed" fill="var(--primary-100)" name="Committed" />
          <Bar dataKey="completed" fill="var(--primary-600)" name="Completed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BurndownChart({
  data,
}: {
  data: Array<{ date: string; remaining: number }>;
}) {
  return (
    <div className="h-64 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="remaining"
            stroke="var(--primary-600)"
            strokeWidth={2}
            dot={false}
            name="Remaining points"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
