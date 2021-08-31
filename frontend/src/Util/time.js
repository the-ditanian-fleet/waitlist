export function formatDuration(durationSeconds) {
  var groups = [];

  var hours = Math.floor(durationSeconds / 3600);
  if (hours > 0) groups.push(`${hours}h`);

  var minutes = Math.floor((durationSeconds % 3600) / 60);
  if (minutes > 0) groups.push(`${minutes}min`);

  var seconds = durationSeconds % 60;
  if (seconds > 0) groups.push(`${seconds}s`);

  if (!groups) {
    return "-";
  }
  if (groups.length > 1) {
    return `${groups[0]} ${groups[1]}`;
  }
  return groups[0];
}
