const stats = [
  { value: "500+", label: "Matches Played" },
  { value: "120+", label: "Teams Hosted" },
  { value: "3,000+", label: "Goals Scored" },
  { value: "4.9", label: "Average Rating" },
];

export default function Stats() {
  return (
    <section className="bg-[#0a1a0f] py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl font-extrabold tracking-tight text-emerald-400 sm:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-medium text-gray-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
