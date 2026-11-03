
"use client";

import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ProjectReport = {
  projectId: number;
  projectName: string;
  workedSeconds: number;
};

type ProjectReportChartProps = {
  data: ProjectReport[];
};

export default function ProjectReportChart({
  data,
}: ProjectReportChartProps) {
  const chartData = data.map((project) => ({
    name: project.projectName,
    hours: Number((project.workedSeconds / 3600).toFixed(2)),
  }));

  return (
    <div className="mt-6 w-full min-w-0">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        Hours spent per project
      </h3>

      {chartData.length === 0 ? (
        <p className="text-sm text-gray-500">
          No project data available for this period.
        </p>
      ) : (
        <div style={{ width: "100%", height: 320, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                interval={0}
                angle={-15}
                textAnchor="end"
                height={65}
              />
              <YAxis
                type="number"
                allowDecimals
                label={{
                  value: "Hours",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                formatter={(value) => [
                  `${value} hours`,
                  "Time worked",
                ]}
              />
              <Bar
                dataKey="hours"
                fill="#2563eb"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
