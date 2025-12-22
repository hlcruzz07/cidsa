import { Badge } from "./badge";

type YearLevel = number;

export default function BadgeYearLevel({ yearLevel }: { yearLevel: number }) {
  const yearLevelBadge: Record<YearLevel, { name: string; className: string }> =
    {
      1: {
      name: "1st Year",
      className:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    },
    2: {
      name: "2nd Year",
      className:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    },
    3: {
      name: "3rd Year",
      className:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    },
    4: {
      name: "4th Year",
      className:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    },
    5: {
      name: "5th Year",
      className:
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    },
    };

  const badge = yearLevelBadge[yearLevel];

  return (
    <Badge variant="secondary" className={badge.className}>
      {badge.name}
    </Badge>
  );
}
