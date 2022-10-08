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

export function diffForHumans(date) {
  const MINUTE = 60,
    HOUR = MINUTE * 60,
    DAY = HOUR * 24,
    WEEK = DAY * 7,
    MONTH = DAY * 30,
    YEAR = DAY * 365;

  const seconds = Math.round((date - new Date()) / 1000);
  let divisor = null;
  let unit = null;

  if (seconds < MINUTE) {
    if (seconds > -60) {
      return "just now";
    }
    if (seconds > -(5 * MINUTE)) {
      return "less than five minutes ago";
    }
    return "Expired";
  } else if (seconds < HOUR) {
    [divisor, unit] = [MINUTE, "minute"];
  } else if (seconds < DAY) {
    [divisor, unit] = [HOUR, "hour"];
  } else if (seconds < WEEK) {
    [divisor, unit] = [DAY, "day"];
  } else if (seconds < MONTH) {
    [divisor, unit] = [WEEK, "week"];
  } else if (seconds < YEAR) {
    [divisor, unit] = [MONTH, "month"];
  } else if (seconds > YEAR) {
    [divisor, unit] = [YEAR, "year"];
  }

  let count = Math.floor(seconds / divisor);
  return `${count} ${unit}${count > 1 ? "s" : ""}`;
}

export function formatDatetime(dateObj) {
  return dateObj.toLocaleString("en-GB", { timeZone: "UTC" });
}

export function formatDate(dateObj) {
  return dateObj.toLocaleString("en-GB", {
    timeZone: "UTC",
    dateStyle: "short",
  });
}